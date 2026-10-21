(() => {
  const client = window.supabaseClient;
  const calendar = document.getElementById('dv-writing-calendar');
  if (!client || !calendar) return;
  const summary = document.getElementById('dv-writing-summary');
  const heading = document.getElementById('dv-writing-month');
  let month = new Date(); month.setDate(1);
  const key = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  async function render() {
    const {data:{user}} = await client.auth.getUser();
    if (!user) { summary.textContent = 'Log in to see your private writing progress.'; return; }
    const start = new Date(month.getFullYear(),month.getMonth(),1);
    const end = new Date(month.getFullYear(),month.getMonth()+1,0);
    heading.textContent = start.toLocaleDateString(undefined,{month:'long',year:'numeric'});
    const {data,error} = await client.from('dv_writing_days')
      .select('activity_date,words_added,chapters_published')
      .eq('writer_id',user.id).gte('activity_date',key(start)).lte('activity_date',key(end));
    if (error) {summary.textContent = 'Writing calendar unavailable. Run the writer rewards SQL and expose dv_writing_days in the Supabase Data API.'; return;}
    const byDate = new Map((data||[]).map(d=>[d.activity_date,d]));
    const totalWords = (data||[]).reduce((n,d)=>n+d.words_added,0);
    const published = (data||[]).reduce((n,d)=>n+d.chapters_published,0);
    const qualified = (data||[]).filter(d=>d.words_added>=100||d.chapters_published>0).length;
    summary.textContent = `${totalWords.toLocaleString()} new words · ${published} chapters published · ${qualified} qualifying days this month. A day qualifies with 100+ new saved words OR a published chapter (UTC). Two consecutive days earn a small ticket; five earn a big ticket. Redeem within 3 days; banners run for 3 days.`;
    calendar.replaceChildren();
    for (const label of ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']) {
      const el=document.createElement('strong');el.textContent=label;calendar.append(el);
    }
    for(let i=0;i<start.getDay();i++) calendar.append(document.createElement('span'));
    for(let day=1;day<=end.getDate();day++){
      const date=key(new Date(start.getFullYear(),start.getMonth(),day));
      const d=byDate.get(date);
      const cell=document.createElement('div');cell.className='dv-writing-day';
      if(d && (d.words_added>=100||d.chapters_published>0))cell.classList.add('dv-writing-qualified');
      const number=document.createElement('strong');number.textContent=day;cell.append(number);
      if(d){const detail=document.createElement('small');detail.textContent=`${d.words_added} words · ${d.chapters_published} published`;cell.append(detail);}
      calendar.append(cell);
    }
  }
  document.getElementById('dv-writing-prev').onclick=()=>{month.setMonth(month.getMonth()-1);render();};
  document.getElementById('dv-writing-next').onclick=()=>{month.setMonth(month.getMonth()+1);render();};
  render().catch(e=>{console.error(e);summary.textContent='Unable to load writing progress.';});
})();
