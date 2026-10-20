"use strict";
// Separate client so this dashboard does not run the general site script.
const adminDb = supabase.createClient(
  "https://atceqhrwsyuighusumun.supabase.co",
  "sb_publishable_6cJXk8zafsZrE8GM8lC_oQ_8agPnDcg"
);
const message = document.getElementById("admin-message");
const content = document.getElementById("admin-content");
const reportsEl = document.getElementById("admin-reports");
const allowedStatuses = ["pending", "reviewed", "resolved", "dismissed"];
function setMessage(value) { message.textContent = value; }
function field(label, value) {
  const p = document.createElement("p");
  const strong = document.createElement("strong"); strong.textContent = label + ": ";
  p.append(strong, document.createTextNode(value == null ? "—" : String(value)));
  return p;
}
async function loadReports() {
  setMessage("Loading reports…");
  reportsEl.replaceChildren();
  const { data, error } = await adminDb.from("story_reports")
    .select("id,story_id,reason,details,status,created_at")
    .order("created_at", { ascending: false }).limit(100);
  if (error) { setMessage("Could not load reports. Check your administrator permissions."); console.error(error); return; }
  setMessage(`${data.length} report(s) loaded (most recent 100 maximum).`);
  if (!data.length) { reportsEl.append(field("Reports", "No reports found")); return; }
  for (const report of data) {
    const card = document.createElement("article"); card.className = "admin-card";
    const heading = document.createElement("h2"); heading.textContent = "Story report"; card.append(heading);
    card.append(field("Report ID", report.id), field("Story ID", report.story_id),
      field("Reason", report.reason), field("Details", report.details),
      field("Submitted", report.created_at ? new Date(report.created_at).toLocaleString() : "—"),
      field("Current status", report.status));
    const label = document.createElement("label"); label.textContent = "Update status: ";
    const select = document.createElement("select");
    for (const status of allowedStatuses) {
      const option = document.createElement("option"); option.value = status;
      option.textContent = status[0].toUpperCase() + status.slice(1); select.append(option);
    }
    select.value = report.status;
    label.append(select);
    const button = document.createElement("button"); button.type = "button"; button.textContent = "Save status";
    const feedback = document.createElement("span"); feedback.setAttribute("role", "status");
    button.addEventListener("click", async () => {
      if (select.value === report.status) { feedback.textContent = "No change."; return; }
      button.disabled = true; feedback.textContent = "Saving…";
      const { error } = await adminDb.from("story_reports")
        .update({ status: select.value }).eq("id", report.id);
      button.disabled = false;
      if (error) { console.error(error); feedback.textContent = "Update failed; check permissions."; return; }
      report.status = select.value; feedback.textContent = "Status saved.";
    });
    card.append(label, button, feedback); reportsEl.append(card);
  }
}
async function init() {
  try {
    const { data: { user }, error: authError } = await adminDb.auth.getUser();
    if (authError || !user) { setMessage("Please log in with your administrator account first."); return; }
    const { data: isAdmin, error } = await adminDb.rpc("is_story_report_admin");
    if (error || isAdmin !== true) { setMessage("Access denied. This account is not authorized for report moderation."); return; }
    content.hidden = false;
    document.getElementById("admin-refresh").addEventListener("click", loadReports);
    await loadReports();
  } catch (error) { console.error(error); setMessage("Could not verify administrator access."); }
}
init();
