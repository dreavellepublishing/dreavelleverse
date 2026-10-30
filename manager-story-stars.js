
/* DreavelleVerse - Story Manager Total Stars
   Read-only: counts chapter stars for the current story.
*/
(() => {
  const counter = document.getElementById('story-star-count');
  const db = window.supabaseClient;

  if (!counter || !db) return;

  const params = new URLSearchParams(window.location.search);

  function getStoryId() {
    return params.get('id') ||
           params.get('story_id') ||
           localStorage.getItem('dreavelleVerseStoryId');
  }

  async function loadStars() {
    const storyId = getStoryId();

    if (!storyId) {
      counter.textContent = '—';
      return;
    }

    const { count, error } = await db
      .from('dv_chapter_stars')
      .select('*', { count: 'exact', head: true })
      .eq('story_id', storyId);

    if (error) {
      console.warn('Could not load story stars:', error);
      counter.textContent = '—';
      return;
    }

    counter.textContent = (count ?? 0).toLocaleString();
  }

  loadStars();

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) loadStars();
  });
})();
