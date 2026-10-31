/* DreavelleVerse R18 writer settings — standalone, non-destructive. */
(() => {
  const panel = document.getElementById('dv-r18-settings');
  if (!panel) return;
  const level = document.getElementById('dv-warning-level');
  const status = document.getElementById('dv-warning-status');
  const save = document.getElementById('dv-save-warning-settings');
  const boxes = [...document.querySelectorAll('#dv-warning-categories input[type="checkbox"]')];
  const say = (message) => { status.textContent = message; };
  const current = () => ({
    storyId: localStorage.getItem('dreavelleVerseStoryId'),
    chapterNumber: Number(localStorage.getItem('dreavelleVerseCurrentChapter') || '1')
  });
  async function getUser() {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase is unavailable. Refresh the page.');
    const {data, error} = await client.auth.getUser();
    if (error) throw error;
    if (!data?.user) throw new Error('Please log in as the chapter writer.');
    return {client, user: data.user};
  }
  async function load() {
    const {storyId, chapterNumber} = current();
    if (!storyId) { say('Select a story before editing content warnings.'); return; }
    try {
      const {client, user} = await getUser();
      const {data, error} = await client.from('chapters')
        .select('is_r18,content_warning_level,content_warning_categories')
        .eq('story_id',storyId).eq('chapter_number',chapterNumber)
        .eq('user_id',user.id).maybeSingle();
      if (error) throw error;
      if (!data) { say('Save this chapter first, then return to save content warnings.'); return; }
      level.value = data.is_r18 ? 'r18' : (['general','advisory'].includes(data.content_warning_level) ? data.content_warning_level : 'general');
      const selected = new Set(data.content_warning_categories || []);
      boxes.forEach(box => { box.checked = selected.has(box.value); });
      say('Existing chapter warning settings loaded.');
    } catch (error) { console.error('R18 settings load failed', error); say('Could not load warnings: ' + error.message); }
  }
  save.addEventListener('click', async () => {
    save.disabled = true; say('Saving warning settings…');
    try {
      const {storyId, chapterNumber} = current();
      if (!storyId) throw new Error('No story selected.');
      const {client, user} = await getUser();
      const {data: chapter, error: findError} = await client.from('chapters')
        .select('id').eq('story_id',storyId).eq('chapter_number',chapterNumber)
        .eq('user_id',user.id).maybeSingle();
      if (findError) throw findError;
      if (!chapter) throw new Error('Save the chapter first before saving warnings.');
      const categories = boxes.filter(box => box.checked).map(box => box.value);
      const warningLevel = level.value;
      const {data: updated, error} = await client.from('chapters').update({
        is_r18: warningLevel === 'r18',
        content_warning_level: warningLevel,
        content_warning_categories: categories,
        updated_at: new Date().toISOString()
      }).eq('id',chapter.id).eq('user_id',user.id).select('id');
      if (error) throw error;
      if (!updated?.length) throw new Error('No chapter was updated. Check your Supabase permissions.');
      say('Content warning settings saved successfully.');
    } catch(error) { console.error('R18 settings save failed',error); say('Could not save warnings: ' + error.message); }
    finally { save.disabled = false; }
  });
  load();
})();
