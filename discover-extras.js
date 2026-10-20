/* Additive Discover features; the existing story and user search remain untouched. */
(() => {
  const client = window.supabaseClient;
  if (!client || !document.getElementById('dv-suggest-people')) return;
  const peopleBox = document.getElementById('dv-suggest-people');
  const storiesBox = document.getElementById('dv-suggest-stories');
  const smallBox = document.getElementById('dv-small-promos');
  const bigBox = document.getElementById('dv-big-promos');
  const eventsBox = document.getElementById('dv-calendar-events');
  const calendar = document.getElementById('dv-calendar');
  const monthLabel = document.getElementById('dv-calendar-month');
  let month = new Date(); month.setDate(1);
  let events = [];
  const el = (tag, className, text) => {const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
  const link = (label, url) => {const a=el('a','start-reading-button',label);a.href=url;return a;};
  const photo = (url, alt, cls='') => {if(!/^https:\/\//i.test(url||''))return null;const img=el('img',cls);img.src=url;img.alt=alt;img.loading='lazy';return img;};
  const dateKey = date => {const d=new Date(date);return Number.isNaN(d.getTime())?'':`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const storyUrl = id => `read-story.html?id=${encodeURIComponent(id)}`;
  function personCard(person) {
    const card=el('article','dv-suggestion-card');
    const avatar=photo(person.avatar_url,'', 'dv-person-avatar');if(avatar)card.append(avatar);
    card.append(el('h4','',person.display_name||'DreavelleVerse member'),el('p','',person.bio||'Discover this reader or writer.'),link('View Profile',`public-profile.html?id=${encodeURIComponent(person.id)}`));return card;
  }
  function storyCard(story) {
    const card=el('article','dv-suggestion-card');const img=photo(story.cover_url,`${story.title||'Story'} cover`);if(img)card.append(img);
    card.append(el('h4','',story.title||'Untitled Story'),el('p','',`By ${story.author||'Unknown author'} · ${story.genre||'Story'}`),link('Read / Like / Follow Story',storyUrl(story.id)));
    if(story.user_id)card.append(link('Follow Writer',`public-profile.html?id=${encodeURIComponent(story.user_id)}`));
    const note=el('small','', 'Comments are available in published chapters.');card.append(note);return card;
  }
  async function loadSuggestions() {
    const {data:{user}}=await client.auth.getUser();
    const [{data:people,error:peopleError},{data:stories,error:storiesError}]=await Promise.all([
      client.from('profiles').select('id,display_name,bio,avatar_url').order('display_name',{ascending:true}).limit(40),
      client.from('stories').select('id,title,author,genre,cover_url,status,user_id').eq('status','Published').limit(60)
    ]);
    peopleBox.replaceChildren();
    if(peopleError)peopleBox.textContent='Suggestions are temporarily unavailable.';
    else {
      const pool=(people||[]).filter(p=>p.id!==user?.id);
      // Rotate visible suggestions daily, without using private data.
      const shift=Math.floor(Date.now()/86400000)%Math.max(pool.length,1);
      const ordered=pool.slice(shift).concat(pool.slice(0,shift));
      ordered.slice(0,6).forEach(p=>peopleBox.append(personCard(p)));
      if(!pool.length)peopleBox.textContent='More readers and writers will appear here as they join.';
    }
    storiesBox.replaceChildren();
    if(storiesError)storiesBox.textContent='Story suggestions are temporarily unavailable.';
    else {
      const ids=(stories||[]).map(s=>s.id);
      let eligible=[];
      if(ids.length){const {data:chapters,error}=await client.from('chapters').select('story_id').in('story_id',ids).eq('status','Published');if(!error){const published=new Set((chapters||[]).map(c=>c.story_id));eligible=(stories||[]).filter(s=>published.has(s.id));}}
      eligible.slice(0,6).forEach(s=>storiesBox.append(storyCard(s)));
      if(!eligible.length)storiesBox.textContent='No published stories yet. Check back when writers publish their first chapters.';
    }
  }
  async function loadPromosAndCalendar() {
    // An unavailable table should not affect the rest of Discover.
    const {data:promos,error:promoError}=await client.from('dv_promotions')
      .select('id,owner_id,story_id,partner_story_id,kind,headline,description,start_date,end_date,partner_approved')
      .lte('start_date',new Date(Date.now()+366*86400000).toISOString().slice(0,10)).gte('end_date',new Date(Date.now()-366*86400000).toISOString().slice(0,10)).limit(150);
    if(promoError){smallBox.textContent='Promotions will appear after the promotion database is set up.';bigBox.replaceChildren();}
    const {data:stories}=await client.from('stories').select('id,title,author,cover_url,status').eq('status','Published').limit(300);
    const storyMap=new Map((stories||[]).map(s=>[s.id,s]));
    const today=dateKey(new Date());
    for(const promo of promos||[]){
      if(promo.kind==='pair'&&!promo.partner_approved)continue;
      const story=storyMap.get(promo.story_id);if(!story)continue;
      const partner=promo.partner_story_id?storyMap.get(promo.partner_story_id):null;
      if(promo.kind==='pair'&&!partner)continue;
      if(promo.start_date<=today&&promo.end_date>=today){
        const card=el('article',`dv-promo-card ${promo.kind==='large'?'dv-large':''}`);
        card.append(el('span','dv-promo-tag',promo.kind==='pair'?'Writer Pair Promotion':promo.kind==='large'?'Featured Spotlight':'Small Spotlight'));
        const img=photo(story.cover_url,`${story.title} cover`);if(img)card.append(img);
        card.append(el('h4','',promo.headline||story.title),el('p','',promo.description||`Discover ${story.title} by ${story.author||'a DreavelleVerse writer'}.`),link('Read Story',storyUrl(story.id)));
        if(partner)card.append(el('p','',`With ${partner.title} by ${partner.author||'another writer'}`),link('Read Partner Story',storyUrl(partner.id)));
        (promo.kind==='large'||promo.kind==='pair'?bigBox:smallBox).append(card);
      }
      // Calendar uses the start date, not each day of a promotion's run.
      events.push({date:promo.start_date,label:`${promo.kind==='pair'?'Pair promotion':promo.kind==='large'?'Featured promotion':'Promotion'}: ${promo.headline||story.title}`,url:storyUrl(story.id)});
    }
    if(!bigBox.children.length)bigBox.textContent='Featured promotions will appear here.';
    if(!smallBox.children.length&&!promoError)smallBox.textContent='Small promotions will appear here.';
    // Only show scheduled chapter releases for stories that are already public.
    const publishedIds=[...storyMap.keys()];
    if(publishedIds.length){
      const {data:chapters}=await client.from('chapters').select('story_id,chapter_number,publish_at,status')
        .in('story_id',publishedIds).eq('status','Scheduled').not('publish_at','is',null)
        .gte('publish_at',new Date(Date.now()-86400000).toISOString()).limit(200);
      for(const ch of chapters||[]){const s=storyMap.get(ch.story_id);if(s)events.push({date:dateKey(ch.publish_at),label:`Upcoming Chapter ${ch.chapter_number}: ${s.title}`,url:storyUrl(s.id)});}
    }
    drawCalendar();
  }
  function drawCalendar(selectedDate='') {
    monthLabel.textContent=month.toLocaleDateString(undefined,{month:'long',year:'numeric'});
    calendar.replaceChildren();
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(day=>calendar.append(el('span','dv-day-label',day)));
    const first=month.getDay(),days=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
    for(let i=0;i<first;i++){const blank=el('button','dv-day');blank.disabled=true;calendar.append(blank);}
    for(let day=1;day<=days;day++){
      const key=dateKey(new Date(month.getFullYear(),month.getMonth(),day));
      const matches=events.filter(e=>e.date===key);const btn=el('button','dv-day');btn.type='button';btn.setAttribute('aria-label',`${key}, ${matches.length} event(s)`);btn.setAttribute('aria-pressed',String(selectedDate===key));btn.append(el('span','',String(day)));
      if(matches.length)btn.append(el('span','dv-dot',`${matches.length} update${matches.length===1?'':'s'} ●`));
      btn.addEventListener('click',()=>drawCalendar(key));calendar.append(btn);
    }
    eventsBox.replaceChildren();
    const selected=selectedDate?events.filter(e=>e.date===selectedDate):events.filter(e=>e.date>=dateKey(new Date())).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,8);
    if(!selected.length){eventsBox.textContent=selectedDate?'No updates or promotions on this date.':'No upcoming updates or promotions announced yet.';return;}
    eventsBox.append(el('h4','',selectedDate?`Events on ${selectedDate}`:'Upcoming events'));
    for(const e of selected){const row=el('p');row.append(el('span','',`${e.date} — ${e.label} `),link('View Story',e.url));eventsBox.append(row);}
  }
  document.getElementById('dv-calendar-prev').onclick=()=>{month.setMonth(month.getMonth()-1);drawCalendar();};
  document.getElementById('dv-calendar-next').onclick=()=>{month.setMonth(month.getMonth()+1);drawCalendar();};
  loadSuggestions().catch(console.error);
  loadPromosAndCalendar().catch(error=>{console.error(error);eventsBox.textContent='Calendar temporarily unavailable.';});
})();
