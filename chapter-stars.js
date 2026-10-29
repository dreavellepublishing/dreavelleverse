
/* DreavelleVerse - Chapter Star / Unstar */
(() => {
  const button = document.getElementById("dv-star-chapter-button");
  const countLabel = document.getElementById("dv-chapter-star-count");
  const message = document.getElementById("dv-chapter-star-message");

  if (!button || !countLabel || !message) return;

  const db = window.supabaseClient;
  if (!db) {
    message.textContent = "Star feature unavailable. Please refresh.";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const storyId = params.get("id");
  const chapterNumber = Number(params.get("chapter"));

  if (!storyId || !Number.isInteger(chapterNumber) || chapterNumber < 0) {
    message.textContent = "Chapter information unavailable.";
    return;
  }

  let currentUser = null;
  let starred = false;
  let busy = false;
  let chapterReady = false;

  const query = () =>
    db.from("dv_chapter_stars")
      .select("user_id")
      .eq("story_id", storyId)
      .eq("chapter_number", chapterNumber);

  function render() {
    button.textContent = starred ? "★ Unstar Chapter" : "☆ Star Chapter";
    button.setAttribute("aria-pressed", String(starred));
    button.disabled = busy || !chapterReady || !currentUser;
  }

  async function refreshCount() {
    const { count, error } = await db
      .from("dv_chapter_stars")
      .select("*", { count: "exact", head: true })
      .eq("story_id", storyId)
      .eq("chapter_number", chapterNumber);

    if (error) throw error;
    countLabel.textContent = `${count ?? 0} stars`;
  }

  async function initialize() {
    try {
      const { data: authData, error: authError } =
        await db.auth.getUser();

      if (authError) throw authError;
      currentUser = authData.user;

      const { data: chapter, error: chapterError } = await db
        .from("chapters")
        .select("status,user_id")
        .eq("story_id", storyId)
        .eq("chapter_number", chapterNumber)
        .maybeSingle();

      if (chapterError) throw chapterError;

      if (!chapter || chapter.status !== "Published") {
        message.textContent = "Stars are available for published chapters.";
        return;
      }

      chapterReady = true;

      if (!currentUser) {
        message.textContent = "Log in to star this chapter.";
      } else if (chapter.user_id === currentUser.id) {
        chapterReady = false;
        message.textContent = "Authors cannot star their own chapters.";
      } else {
        const { data, error } = await query()
          .eq("user_id", currentUser.id)
          .maybeSingle();

        if (error) throw error;
        starred = Boolean(data);
        message.textContent = "";
      }

      await refreshCount();
      render();
    } catch (error) {
      message.textContent = `Could not load stars: ${error.message}`;
      button.disabled = true;
    }
  }

  button.addEventListener("click", async () => {
    if (busy || !currentUser || !chapterReady) return;

    busy = true;
    render();
    message.textContent = "";

    try {
      if (starred) {
        const { error } = await db
          .from("dv_chapter_stars")
          .delete()
          .eq("story_id", storyId)
          .eq("chapter_number", chapterNumber)
          .eq("user_id", currentUser.id);

        if (error) throw error;
        starred = false;
        message.textContent = "Star removed.";
      } else {
        const { error } = await db
          .from("dv_chapter_stars")
          .insert({
            story_id: storyId,
            chapter_number: chapterNumber,
            user_id: currentUser.id
          });

        if (error) throw error;
        starred = true;
        message.textContent = "Chapter starred!";
      }

      await refreshCount();
    } catch (error) {
      message.textContent = `Could not update star: ${error.message}`;
    } finally {
      busy = false;
      render();
    }
  });

  initialize();
})();
