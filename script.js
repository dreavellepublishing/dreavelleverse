/* Supabase Connection */
const SUPABASE_URL = "https://atceqhrwsyuighusumun.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_6cJXk8zafsZrE8GM8lC_oQ_8agPnDcg";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);
window.supabaseClient = supabaseClient;

const writingArea = document.querySelector(".chapter-writing-area");
const wordCount = document.querySelector(".word-count");

if (writingArea && wordCount) {

    writingArea.addEventListener("input", function () {

        const text = writingArea.value.trim();

        if (text === "") {
            wordCount.textContent = "0 words";
            return;
        }

        const words = text.split(/\s+/);

        wordCount.textContent =
            words.length === 1
                ? "1 word"
                : `${words.length} words`;
    });

}

/* Automatic Draft Saving */

const chapterTitle = document.querySelector(".chapter-title-input");
const saveStatus = document.querySelector(".save-status");

async function saveDraftAutomatically() {

    if (!writingArea || !chapterTitle) {
        return;
    }

    const currentChapterNumber = Number(
        localStorage.getItem(
            "dreavelleVerseCurrentChapter"
        ) || "1"
    );

    const storyId =
        localStorage.getItem(
            "dreavelleVerseStoryId"
        );

    /* Keep local recovery copy */

    localStorage.setItem(
        "dreavelleVerseChapterTitle",
        chapterTitle.value
    );

    localStorage.setItem(
        "dreavelleVerseChapterContent",
        writingArea.value
    );

    if (!storyId) {
        return;
    }

    const { data: { session } } =
        await supabaseClient.auth.getSession();

    if (!session || !session.user) {
        return;
    }
const { data: existingChapter, error: statusError } =
    await supabaseClient
        .from("chapters")
        .select("status, publish_at")
        .eq("story_id", storyId)
        .eq("user_id", session.user.id)
        .eq("chapter_number", currentChapterNumber)
        .maybeSingle();

if (statusError) {
    console.error(
        "Could not check chapter status before autosave:",
        statusError
    );
    return;
}

const currentStatus = existingChapter?.status || "Draft";
const currentPublishAt = existingChapter?.publish_at || null;
    const { error } =
        await supabaseClient
            .from("chapters")
            .upsert(
                {
                    story_id: storyId,
                    user_id: session.user.id,
                    chapter_number:
                        currentChapterNumber,
                    title: chapterTitle.value,
                    content: writingArea.value,
                   status: currentStatus,
publish_at: currentPublishAt,
                    updated_at:
                        new Date().toISOString()
                },
                {
                    onConflict:
                        "story_id,chapter_number"
                }
            );

    if (error) {
        console.error(
            "Could not autosave chapter:",
            error
        );

        if (saveStatus) {
            saveStatus.textContent =
                "Saved locally";
        }

        return;
    }

    if (saveStatus) {

        saveStatus.classList.remove(
            "published",
            "draft"
        );

        saveStatus.classList.add("draft");

        saveStatus.textContent =
            "All changes saved";
    }
}

if (writingArea && chapterTitle) {

    writingArea.addEventListener("input", function () {
    if (saveStatus) {
        saveStatus.textContent = "Saving...";
    }

    setTimeout(function () {
        saveDraftAutomatically();
    }, 500);
});

   chapterTitle.addEventListener("input", function () {
    if (saveStatus) {
        saveStatus.textContent = "Saving...";
    }

    setTimeout(function () {
        saveDraftAutomatically();
    }, 500);
});
}

/* Restore Saved Draft */

async function restoreSavedDraft() {

    if (!writingArea || !chapterTitle) {
        return;
    }

    const currentChapterNumber = Number(
        localStorage.getItem(
            "dreavelleVerseCurrentChapter"
        ) || "1"
    );

    const storyId =
        localStorage.getItem(
            "dreavelleVerseStoryId"
        );

    if (!storyId) {
        return;
    }

    const { data: { session } } =
        await supabaseClient.auth.getSession();

    if (!session || !session.user) {
        return;
    }

    const { data: chapter, error } =
        await supabaseClient
            .from("chapters")
            .select("title, content, status")
            .eq("story_id", storyId)
            .eq("user_id", session.user.id)
            .eq(
                "chapter_number",
                currentChapterNumber
            )
            .maybeSingle();

    if (error) {
        console.error(
            "Could not restore chapter draft:",
            error
        );
        return;
    }

    if (!chapter) {
        return;
    }

    chapterTitle.value =
        chapter.title ||
        `Chapter ${currentChapterNumber}`;

    writingArea.value =
        chapter.content || "";

    if (saveStatus) {
        saveStatus.textContent =
            chapter.status === "Draft"
                ? "Draft recovered"
                : chapter.status;
    }

    const text = writingArea.value.trim();

    if (wordCount) {

        if (text === "") {
            wordCount.textContent = "0 words";
        } else {

            const words = text.split(/\s+/);

            wordCount.textContent =
                words.length === 1
                    ? "1 word"
                    : `${words.length} words`;
        }
    }
}

restoreSavedDraft();

/* Manual Save Draft Button */

const saveDraftButton = document.querySelector(".save-draft-button");

if (saveDraftButton) {

    saveDraftButton.addEventListener("click", async function () {

        saveDraftAutomatically();

        const currentChapterNumber = Number(
            localStorage.getItem(
                "dreavelleVerseCurrentChapter"
            ) || "1"
        );

        const storyId = localStorage.getItem(
            "dreavelleVerseStoryId"
        );

        if (!storyId) {
            console.error("No DreavelleVerse story ID found.");
            return;
        }

        const { data: { session } } =
            await supabaseClient.auth.getSession();

        if (!session || !session.user) {
            console.error("No logged-in user found.");
            return;
        }

        const draftData = {
            title: chapterTitle.value,
            content: writingArea.value
        };

        const { error } = await supabaseClient
            .from("chapters")
            .upsert(
                {
                    story_id: storyId,
                    user_id: session.user.id,
                    chapter_number: currentChapterNumber,
                    title: chapterTitle.value,
                    content: writingArea.value,
                    status: "Draft",
                    publish_at: null,
                    updated_at: new Date().toISOString()
                },
                {
                    onConflict: "story_id,chapter_number"
                }
            );

        if (error) {
            console.error(
                "Could not save chapter draft:",
                error
            );
            return;
        }

        /* Keep localStorage temporarily for existing features */

        localStorage.setItem(
            `dreavelleVerseDraftChapter${currentChapterNumber}`,
            JSON.stringify(draftData)
        );

        localStorage.removeItem(
            `dreavelleVerseRecoveryChapter${currentChapterNumber}`
        );

        localStorage.setItem(
            "dreavelleVerseChapterStatus",
            "Draft"
        );

        if (saveStatus) {
            saveStatus.classList.remove(
                "published",
                "draft"
            );

            saveStatus.classList.add("draft");
            saveStatus.textContent = "Draft saved";
        }
    });
}
const storyEditMode =
    new URLSearchParams(window.location.search).get("mode") === "edit";
    const storyFormHeading = document.querySelector(
    "#story-form-heading"
);

if (storyEditMode && storyFormHeading) {
    storyFormHeading.textContent = "Edit Story Information";
}

const storyFormGreeting = document.querySelector(
    "#story-form-greeting"
);

if (storyEditMode && storyFormGreeting) {
    storyFormGreeting.textContent = "Manage Your Story";
}

const storyFormIntro = document.querySelector(
    "#story-form-intro"
);

if (storyEditMode && storyFormIntro) {
    storyFormIntro.textContent =
        "Update your story details below. Your chapters will stay unchanged.";
}

/* Save Story Information */

const storyTitleInput = document.querySelector("#story-title");
const saveStoryButton = document.querySelector("#save-story-button");
const storyAuthorInput = document.querySelector("#story-author");

/* Use Logged In User As Author */

if (storyAuthorInput && !storyEditMode) {
    (async function () {
        const { data: { session } } =
            await supabaseClient.auth.getSession();

        if (!session || !session.user) {
            return;
        }

        const { data: profile, error } =
            await supabaseClient
                .from("profiles")
                .select("display_name")
                .eq("id", session.user.id)
                .maybeSingle();

        if (error) {
            console.error(
                "Could not load author name:",
                error
            );
        }

        const authorName =
            profile?.display_name ||
            session.user.user_metadata?.display_name ||
            session.user.email ||
            "";

        storyAuthorInput.value = authorName;
    })();
}

const storyDescriptionInput = document.querySelector("#story-description");
const storyGenreInput = document.querySelector("#story-genre");
const storyTagsInput = document.querySelector("#story-tags");
const storyCoverInput =
    document.querySelector("#story-cover");

let selectedStoryCover = null;

if (storyCoverInput) {
    storyCoverInput.addEventListener(
        "change",
        function () {
            selectedStoryCover =
                this.files[0] || null;
        }
    );
}
if (storyEditMode && saveStoryButton) {
    saveStoryButton.textContent = "Save Changes";
}
if (storyEditMode && storyTitleInput) {

    (async function () {

        const { data: { session } } =
            await supabaseClient.auth.getSession();

        if (!session || !session.user) {
            return;
        }

        const storyId =
            localStorage.getItem(
                "dreavelleVerseStoryId"
            );

        if (!storyId) {
            console.error(
                "Could not load story: Story ID not found."
            );
            return;
        }

        const { data: story, error } =
            await supabaseClient
                .from("stories")
                .select(
                    "title, author, description, genre, tags"
                )
                .eq("id", storyId)
                .eq("user_id", session.user.id)
                .single();

        if (error) {
            console.error(
                "Could not load story for editing:",
                error
            );
            return;
        }

        storyTitleInput.value =
            story.title || "";

        if (storyAuthorInput) {
            storyAuthorInput.value =
                story.author || "";
        }

        if (storyDescriptionInput) {
            storyDescriptionInput.value =
                story.description || "";
        }

        if (storyGenreInput) {
            storyGenreInput.value =
                story.genre || "";
        }

        if (storyTagsInput) {
            storyTagsInput.value =
                story.tags || "";
        }

    })();
}

if (storyTitleInput && saveStoryButton) {

    saveStoryButton.addEventListener("click", async function () {
        const storyTitle = storyTitleInput.value.trim();

       if (storyTitle !== "") {
        const { data: { session } } =
    await supabaseClient.auth.getSession();

if (!session || !session.user) {
    return;
}

const storyAuthor =
    storyAuthorInput
        ? storyAuthorInput.value.trim()
        : "";

const storyDescription =
    storyDescriptionInput
        ? storyDescriptionInput.value.trim()
        : "";

const storyGenre =
    storyGenreInput
        ? storyGenreInput.value
        : "";

const storyTags =
    storyTagsInput
        ? storyTagsInput.value.trim()
        : "";
        if (!storyEditMode) {
    const { data: newStory, error: storyError } =
        await supabaseClient
            .from("stories")
            .insert({
                user_id: session.user.id,
                title: storyTitle,
                author: storyAuthor,
                description: storyDescription,
                genre: storyGenre,
                tags: storyTags,
                status: "Draft"
            })
            .select()
            .single();

    if (storyError) {
        console.error(
            "Could not save story:",
            storyError
        );
        return;
    }

    localStorage.setItem(
        "dreavelleVerseStoryId",
        newStory.id
    );
}

if (storyEditMode) {
    const storyId =
        localStorage.getItem(
            "dreavelleVerseStoryId"
        );

    if (!storyId) {
        console.error(
            "Could not update story: Story ID not found."
        );
        return;
    }

    const { error: storyUpdateError } =
        await supabaseClient
            .from("stories")
            .update({
                title: storyTitle,
                author: storyAuthor,
                description: storyDescription,
                genre: storyGenre,
                tags: storyTags,
                updated_at: new Date().toISOString()
            })
            .eq("id", storyId)
            .eq("user_id", session.user.id);

    if (storyUpdateError) {
        console.error(
            "Could not update story:",
            storyUpdateError
        );
        return;
    }
}

    localStorage.setItem(
        "dreavelleVerseStoryTitle",
        storyTitle
    );
localStorage.setItem(
    "dreavelleVerseStoryAuthor",
    storyAuthorInput ? storyAuthorInput.value.trim() : ""
);


localStorage.setItem(
    "dreavelleVerseStoryDescription",
    storyDescriptionInput ? storyDescriptionInput.value.trim() : ""
);


localStorage.setItem(
    "dreavelleVerseStoryGenre",
    storyGenreInput ? storyGenreInput.value : ""
);


localStorage.setItem(
    "dreavelleVerseStoryTags",
    storyTagsInput ? storyTagsInput.value.trim() : ""
);
if (selectedStoryCover) {

    const storyId =
        localStorage.getItem(
            "dreavelleVerseStoryId"
        );

    if (!storyId) {
        console.error(
            "Could not upload cover: Story ID not found."
        );
        return;
    }

    const fileExtension =
        selectedStoryCover.name
            .split(".")
            .pop();

    const coverPath =
        `${session.user.id}/${storyId}/cover.${fileExtension}`;

    const { error: coverUploadError } =
        await supabaseClient.storage
            .from("story-covers")
            .upload(
                coverPath,
                selectedStoryCover,
                {
                    upsert: true
                }
            );

    if (coverUploadError) {
        console.error(
            "Could not upload story cover:",
            coverUploadError
        );
        return;
    }

    const { data: coverData } =
        supabaseClient.storage
            .from("story-covers")
            .getPublicUrl(coverPath);

    const coverUrl =
        coverData.publicUrl;

    const { error: coverUpdateError } =
        await supabaseClient
            .from("stories")
            .update({
                cover_url: coverUrl,
                updated_at:
                    new Date().toISOString()
            })
            .eq("id", storyId)
            .eq("user_id", session.user.id);

    if (coverUpdateError) {
        console.error(
            "Could not save story cover URL:",
            coverUpdateError
        );
        return;
    }
}

if (!storyEditMode) {
    localStorage.removeItem(
        "dreavelleVerseChapterTitle"
    );

    localStorage.removeItem(
        "dreavelleVerseChapterContent"
    );

    localStorage.removeItem(
    "dreavelleVerseChapter1"
);
localStorage.removeItem(
    "dreavelleVerseChapter2"
);
localStorage.removeItem(
    "dreavelleVerseChapterStatus"
);
localStorage.setItem(
    "dreavelleVerseTotalChapters",
    "1"
);
localStorage.setItem(
    "dreavelleVerseCurrentChapter",
    "1"
);
}
  if (storyEditMode) {
    window.location.href = "story-manager.html";
} else {
    window.location.href = "chapter-editor.html";
}
}
});
}

/* Display Story Title in Chapter Editor */

const editorStoryName = document.querySelector(".editor-story-name");

if (editorStoryName) {
    (async function loadEditorStoryName() {
        const { data: { session }, error: sessionError } =
            await supabaseClient.auth.getSession();

        if (sessionError || !session?.user) return;

        const urlStoryId = new URLSearchParams(window.location.search).get("id");
        let storyId = urlStoryId || localStorage.getItem("dreavelleVerseStoryId");

        if (!storyId) {
            const { data: latestStory, error: latestError } = await supabaseClient
                .from("stories")
                .select("id")
                .eq("user_id", session.user.id)
                .order("updated_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (latestError) {
                console.error("Could not find editor story:", latestError);
                return;
            }
            storyId = latestStory?.id;
        }

        if (!storyId) return;

        const { data: story, error } = await supabaseClient
            .from("stories")
            .select("title")
            .eq("id", storyId)
            .eq("user_id", session.user.id)
            .maybeSingle();

        if (error) {
            console.error("Could not load editor story title:", error);
            return;
        }

        if (!story) return;

        editorStoryName.textContent = story.title || "Untitled Story";
        localStorage.setItem("dreavelleVerseStoryId", storyId);
        localStorage.setItem("dreavelleVerseStoryTitle", story.title || "");
    })();
}


/* Display Story Information on Story Manager */

const managerStoryTitle =
    document.querySelector(".manager-story-title");

const managerStoryDescription =
    document.querySelector(".manager-story-description");

const managerStoryAuthor =
    document.querySelector(".manager-story-author");

const managerStoryGenre =
    document.querySelector(".manager-story-genre");

const managerStoryTags =
    document.querySelector(".manager-story-tags");

if (managerStoryTitle) {

    (async function () {

        const { data: { session } } =
            await supabaseClient.auth.getSession();

        if (!session || !session.user) {
            return;
        }

       let storyId =
    localStorage.getItem(
        "dreavelleVerseStoryId"
    );

if (!storyId) {

    const { data: latestStory, error: latestStoryError } =
        await supabaseClient
            .from("stories")
            .select("id")
            .eq("user_id", session.user.id)
            .order("updated_at", {
                ascending: false
            })
            .limit(1)
            .maybeSingle();

    if (latestStoryError) {
        console.error(
            "Could not recover story:",
            latestStoryError
        );
        return;
    }

    if (!latestStory) {
        managerStoryTitle.textContent =
            "Untitled Story";
        return;
    }

    storyId = latestStory.id;

    localStorage.setItem(
        "dreavelleVerseStoryId",
        storyId
    );
}

        const { data: story, error } =
            await supabaseClient
                .from("stories")
                .select(
    "title, author, description, genre, tags, cover_url, completion_status"
)
                .eq("id", storyId)
                .eq("user_id", session.user.id)
                .single();

        if (error) {
            console.error(
                "Could not load story:",
                error
            );
            return;
        }
        
        // Load likes and follows for this specific story
        const storyLikeCount =
            document.getElementById("story-like-count");

        const storyFollowCount =
            document.getElementById("story-follow-count");

        if (storyLikeCount) {
            storyLikeCount.textContent = "…";
        }

        if (storyFollowCount) {
            storyFollowCount.textContent = "…";
        }

        const [likesResult, followsResult] = await Promise.all([
            supabaseClient
                .from("story_likes")
                .select("*", { count: "exact", head: true })
                .eq("story_id", storyId),

            supabaseClient
                .from("story_follows")
                .select("*", { count: "exact", head: true })
                .eq("story_id", storyId)
        ]);

        if (storyLikeCount) {
            storyLikeCount.textContent = likesResult.error
                ? "—"
                : String(likesResult.count ?? 0);
        }

        if (storyFollowCount) {
            storyFollowCount.textContent = followsResult.error
                ? "—"
                : String(followsResult.count ?? 0);
        }

        if (likesResult.error) {
            console.error("Unable to load story likes:", likesResult.error);
        }

        if (followsResult.error) {
            console.error("Unable to load story follows:", followsResult.error);
        }

        managerStoryTitle.textContent =
            story.title || "Untitled Story";
        const managerStoryCover =
    document.getElementById("manager-story-cover");

if (managerStoryCover) {
    if (story.cover_url) {
        managerStoryCover.src = story.cover_url;
        managerStoryCover.style.display = "block";
    } else {
        managerStoryCover.removeAttribute("src");
        managerStoryCover.style.display = "none";
    }
}

        if (managerStoryDescription) {
    const fullDescription = story.description || "";
    const previewLength = 280;

    managerStoryDescription.textContent = "";

    if (fullDescription.length > previewLength) {
        const previewText = document.createElement("span");
        previewText.textContent =
            fullDescription.slice(0, previewLength).trimEnd() + "... ";

        const readMoreButton = document.createElement("button");
        readMoreButton.type = "button";
        readMoreButton.className = "manager-read-more";
        readMoreButton.textContent = "Read More";

        let expanded = false;

        readMoreButton.addEventListener("click", () => {
            expanded = !expanded;

            previewText.textContent = expanded
                ? fullDescription + " "
                : fullDescription.slice(0, previewLength).trimEnd() + "... ";

            readMoreButton.textContent =
                expanded ? "Show Less" : "Read More";
        });

        managerStoryDescription.append(
            previewText,
            readMoreButton
        );
    } else {
        managerStoryDescription.textContent = fullDescription;
    }
}

        if (managerStoryAuthor) {
            managerStoryAuthor.textContent =
                "Author: " +
                (story.author || "Unknown Author");
        }

        if (managerStoryGenre) {
            managerStoryGenre.textContent =
                story.genre
                    ? "Genre: " + story.genre
                    : "";
        }

        if (managerStoryTags) {
            managerStoryTags.textContent =
                story.tags
                    ? "Tags: " + story.tags
                    : "";
        }
    })();
}

/* Display Chapter Title on Story Manager */

const managerChapterTitle = document.querySelector(".manager-chapter-title");

if (managerChapterTitle) {

    const savedChapterTitle = localStorage.getItem(
        "dreavelleVerseChapterTitle"
    );

    if (savedChapterTitle) {
        managerChapterTitle.textContent = savedChapterTitle;
    }

}

/* Publish Chapter */

const publishChapterButton = document.querySelector(
    ".publish-chapter-button"
);

if (publishChapterButton) {
(async function syncPublishButtonWithSupabase() {
    const currentChapterNumber = Number(
        localStorage.getItem("dreavelleVerseCurrentChapter") || "1"
    );

    const storyId = localStorage.getItem(
        "dreavelleVerseStoryId"
    );

    const { data: { session } } =
        await supabaseClient.auth.getSession();

    if (!session || !session.user || !storyId) {
        return;
    }

    const { data: chapter, error } =
        await supabaseClient
            .from("chapters")
            .select("status")
            .eq("story_id", storyId)
            .eq("user_id", session.user.id)
            .eq("chapter_number", currentChapterNumber)
            .maybeSingle();

    if (error) {
        console.error(
            "Could not check chapter publish status:",
            error
        );
        return;
    }

    if (
        chapter &&
        chapter.status &&
        chapter.status.toLowerCase() === "published"
    ) {
        publishChapterButton.textContent = "Unpublish Chapter";
    } else {
        publishChapterButton.textContent = "Publish Chapter";
    }
})();
    publishChapterButton.addEventListener("click", async function () {

       await saveDraftAutomatically();

        const currentChapterNumber = Number(
            localStorage.getItem(
                "dreavelleVerseCurrentChapter"
            ) || "1"
        );

        const storyId = localStorage.getItem(
            "dreavelleVerseStoryId"
        );

        const { data: { session } } =
            await supabaseClient.auth.getSession();

        if (!session || !session.user || !storyId) {
            console.error(
                "Cannot publish chapter: missing user or story."
            );
            return;
        }

        const { error } = await supabaseClient
            .from("chapters")
            .upsert(
                {
                    story_id: storyId,
                    user_id: session.user.id,
                 
