
/* DreavelleVerse - Writer Story Star Counts
   Read-only. Preserves existing story cards.
*/
(() => {
  const list = document.getElementById('writer-story-list');
  if (!list) return;

  const cache = new Map();
  const loading = new Map();

  function getDb() {
    return window.supabaseClient;
  }

  function storyIdFromLink(link) {
    try {
      const url = new URL(link.href, location.href);
      return url.searchParams.get('id') ||
             url.searchParams.get('story_id');
    } catch {
      return null;
    }
  }

  async function getStars(storyId) {
    if (cache.has(storyId)) return cache.get(storyId);
    if (loading.has(storyId)) return loading.get(storyId);

    const db = getDb();
    if (!db) return null;

    const request = (async () => {
      const { count, error } = await db
        .from('dv_chapter_stars')
        .select('*', { count: 'exact', head: true })
        .eq('story_id', storyId);

      if (error) {
        console.warn('Star count error:', error);
        return null;
      }

      const total = count ?? 0;
      cache.set(storyId, total);
      return total;
    })();

    loading.set(storyId, request);

    try {
      return await request;
    } finally {
      loading.delete(storyId);
    }
  }

  async function updateBadge(badge, storyId) {
    const total = await getStars(storyId);
    if (!badge.isConnected) return;

    badge.textContent = total === null
      ? '⭐ — Stars'
      : `⭐ ${total} ${total === 1 ? 'Star' : 'Stars'}`;
  }

  function updateCards() {
    const links = list.querySelectorAll(
      'a[href*="story-manager.html"]'
    );

    links.forEach(link => {
      const storyId = storyIdFromLink(link);
      if (!storyId) return;

      // Find the smallest ancestor containing the
      // story's existing Likes badge.
      let card = link.parentElement;
      let likesBadge = null;

      while (card && card !== list) {
        const candidates = card.querySelectorAll(
          'span, .story-stat, .story-badge'
        );

        likesBadge = [...candidates].find(node =>
          /^\s*[♡♥❤️]?\s*\d+\s+Likes?\s*$/i
            .test(node.textContent.trim())
        );

        if (likesBadge) break;
        card = card.parentElement;
      }

      if (!likesBadge || !card || card === list) return;

      let badge = card.querySelector(
        `[data-dv-star-story="${CSS.escape(storyId)}"]`
      );

      if (!badge) {
        badge = document.createElement('span');
        badge.className = likesBadge.className;
        badge.dataset.dvStarStory = storyId;
        badge.textContent = '⭐ … Stars';

        likesBadge.insertAdjacentElement('afterend', badge);
      }

      updateBadge(badge, storyId);
    });
  }

  let scheduled = false;

  function scheduleUpdate() {
    if (scheduled) return;
    scheduled = true;

    requestAnimationFrame(() => {
      scheduled = false;
      updateCards();
    });
  }

  const observer = new MutationObserver(scheduleUpdate);

  observer.observe(list, {
    childList: true,
    subtree: true
  });

  updateCards();

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      cache.clear();
      scheduleUpdate();
    }
  });
})();
