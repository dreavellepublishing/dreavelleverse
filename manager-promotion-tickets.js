/* DreavelleVerse — manager promotion ticket count (read-only).
   Requires the existing Supabase client initialized by script.js.
   Counts the signed-in writer's unredeemed, unexpired tickets.
*/
(() => {
  const counter = document.getElementById('dv-manager-ticket-count');
  const link = document.getElementById('dv-manager-promotion-link');
  if (!counter || !link) return;

  function selectedStoryId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || params.get('story_id') ||
      localStorage.getItem('dreavelleVerseStoryId');
  }

  function prepareLink() {
    const id = selectedStoryId();
    if (id) {
      // The planner already restores this key when its story list loads.
      localStorage.setItem('dvPromotionSelectedStoryId', id);
    }
  }

  link.addEventListener('click', prepareLink);

  async function refreshTickets() {
    const db = window.supabaseClient;
    if (!db) { counter.textContent = '—'; return; }
    try {
      const { data: { user }, error: authError } = await db.auth.getUser();
      if (authError || !user) { counter.textContent = '—'; return; }
      const { data, error } = await db
        .from('dv_promotion_tickets')
        .select('id,expires_at,redeemed_at')
        .eq('writer_id', user.id)
        .is('redeemed_at', null)
        .gt('expires_at', new Date().toISOString());
      if (error) throw error;
      counter.textContent = (data || []).length.toLocaleString();
      link.setAttribute('aria-label', `${(data || []).length} available promotion tickets. Open promotion planner`);
    } catch (error) {
      console.warn('Unable to load available promotion tickets:', error);
      counter.textContent = '—';
    }
  }

  refreshTickets();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshTickets();
  });
})();
