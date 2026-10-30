
/* DreavelleVerse - Writer Story Star Counts
   Displays total chapter stars on writer story cards.
   Read-only: does not modify existing records.
*/
(() => {
  const db = window.supabaseClient;
  const list = document.getElementById('writer-story-list');

  if (!db || !list) return;

  const starCache = new Map();
  const pending = new Set();

  function getStoryId(card) {
    const link = card.querySelector(
      'a[href*="story-manager.html"], a[href*="read-story.html"]'
    );

    if (!link) return null;

    try {
      const url = new URL(link.href, location.href);
      return url.searchParams.get('id') ||
             url.searchParams.get('story_id');
    } catch {
      return null;
    }
  }

  async function loadStars(storyId, badge) {
    if (starCache.has(storyId)) {
      badge.textContent = `⭐ ${starCache.get(storyId)} Stars`;
      return;
    }

    if (pending.has(storyId)) return;
    pending.add(storyId);

    const { count, error } = await db
      .from('dv_chapter_stars')
      .select('*', { count: 'exact', head: true })
      .eq('story_id', storyId);

    pending.delete(storyId);

    if (error) {
      console.warn('Could not load story stars:', error);
      badge.textContent = '⭐ — Stars';
      return;
    }

    const total = count ?? 0;
    starCache.set(storyId, total);

    list.querySelectorAll('[data-dv-star-story]').forEach(node => {
      if (node.dataset.dvStarStory === storyId) {
        node.textContent = `⭐ ${total} Stars`;
      }
    });
  }

  function updateCards() {
    const links = list.querySelectorAll(
      'a[href*="story-manager.html"]'
    );

    links.forEach(link => {
      const card = link.closest(
        '.writer-story-card, .story-card, article'
      );

      if (!card || card.querySelector('[data-dv-star-story]')) {
        return;
      }

      const storyId = getStoryId(card);
      if (!storyId) return;

      const badges = [...card.querySelectorAll(
        'span, .story-stat, .story-badge'
      )];

      const likesBadge = badges.find(node =>
        /\d+\s+Likes?\b/i.test(node.textContent.trim())
      );

      if (!likesBadge) return;

      const starBadge = document.createElement('span');

      starBadge.className = likesBadge.className;
      starBadge.dataset.dvStarStory = storyId;
      starBadge.textContent = '⭐ … Stars';

      likesBadge.insertAdjacentElement('afterend', starBadge);

      loadStars(storyId, starBadge);
    });
  }

  const observer = new MutationObserver(() => {
    updateCards();
  });

  observer.observe(list, {
    childList: true,
    subtree: true
  });

  updateCards();

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      starCache.clear();
      updateCards();
    }
  });
})();
