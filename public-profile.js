/* Public profiles: view and follow readers or writers. */
(async function () {
    const card = document.getElementById("public-profile-card");
    const status = document.getElementById("public-profile-status");
    const id = new URLSearchParams(location.search).get("id");
    if (!id || !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id)) {
        status.textContent = "Invalid profile link.";
        return;
    }
    const { data: person, error } = await supabaseClient.from("profiles")
        .select("id, display_name, bio, avatar_url, cover_url")
        .eq("id", id).maybeSingle();
    if (error || !person) {
        status.textContent = "Profile unavailable. The profiles table may need a public read policy.";
        if (error) console.error("Public profile load error:", error);
        return;
    }
    card.replaceChildren();
    const cover = document.createElement("div");
    if (person.cover_url && /^https:\/\//i.test(person.cover_url)) {
        const img = document.createElement("img"); img.className = "public-cover"; img.src = person.cover_url; img.alt = "Profile cover"; cover.append(img);
    } else { cover.className = "public-cover"; }
    const avatar = document.createElement("img"); avatar.className = "public-avatar"; avatar.alt = "Profile picture";
    if (person.avatar_url && /^https:\/\//i.test(person.avatar_url)) avatar.src = person.avatar_url;
    else avatar.style.visibility = "hidden";
    const heading = document.createElement("h2"); heading.textContent = person.display_name || "Reader";
    const bio = document.createElement("p"); bio.textContent = person.bio || "DreavelleVerse member";
    const count = document.createElement("p"); count.textContent = "Loading followers...";
    const follow = document.createElement("button"); follow.type = "button"; follow.textContent = "Follow";
    const feedback = document.createElement("p"); feedback.setAttribute("role", "status");
    card.append(cover, avatar, heading, bio, count, follow, feedback);
    const { data: { session } } = await supabaseClient.auth.getSession();
    const myId = session?.user?.id;
    if (!myId) { follow.textContent = "Log in to Follow"; follow.onclick = () => location.href = "login.html"; }
    else if (myId === id) { follow.textContent = "My Profile"; follow.onclick = () => location.href = "profile.html"; }
    async function refreshCount() {
        const { count: total, error: countError } = await supabaseClient.from("account_follows")
            .select("follower_id", { count: "exact", head: true }).eq("followed_id", id);
        count.textContent = countError ? "Followers unavailable" : `${total ?? 0} follower${total === 1 ? "" : "s"}`;
    }
    await refreshCount();
    if (!myId || myId === id) return;
    const { data: existing, error: existingError } = await supabaseClient.from("account_follows")
        .select("follower_id").eq("follower_id", myId).eq("followed_id", id).maybeSingle();
    if (existingError) { feedback.textContent = "Following is currently unavailable."; console.error(existingError); return; }
    let isFollowing = !!existing;
    follow.textContent = isFollowing ? "Unfollow" : "Follow";
    follow.addEventListener("click", async () => {
        follow.disabled = true; feedback.textContent = "";
        const result = isFollowing
            ? await supabaseClient.from("account_follows").delete().eq("follower_id", myId).eq("followed_id", id)
            : await supabaseClient.from("account_follows").insert({ follower_id: myId, followed_id: id });
        if (result.error) { feedback.textContent = "Unable to update follow: " + result.error.message; console.error(result.error); }
        else { isFollowing = !isFollowing; follow.textContent = isFollowing ? "Unfollow" : "Follow"; await refreshCount(); }
        follow.disabled = false;
    });
})();
