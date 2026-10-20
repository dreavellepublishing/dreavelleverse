(() => {
  const client=window.supabaseClient;
  const form=document.getElementById('dv-promo-form');
  if(!client||!form)return;
  const $=id=>document.getElementById(id);
  const status=$('dv-planner-status'), own=$('dv-promo-story'), partner=$('dv-promo-partner');
  let userId='', myStories=[], otherStories=[];
  const make=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
  function option(select,story){const opt=document.createElement('option');opt.value=story.id;opt.textContent=`${story.title} — ${story.author||'Writer'}`;select.append(opt);}
  function dateISO(d){const v=new Date(d);return `${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,'0')}-${String(v.getDate()).padStart(2,'0')}`;}
  $('dv-promo-kind').onchange=()=>{$('dv-promo-partner-wrap').hidden=$('dv-promo-kind').value!=='pair';};
  async function refresh() {
    const {data:{user},error:authError}=await client.auth.getUser();
    if(authError||!user){status.replaceChildren(make('span','Please log in to create promotions. '));const a=make('a','Log in');a.href='login.html';status.append(a);$('dv-my-promos').textContent='Log in first.';$('dv-pair-requests').textContent='Log in first.';return;}
    userId=user.id;
    const {data:stories,error:storyError}=await client.from('stories').select('id,title,author,user_id,status').eq('status','Published').limit(300);
    if(storyError){status.textContent='Unable to load stories. Please try again.';return;}
    myStories=(stories||[]).filter(s=>s.user_id===userId);otherStories=(stories||[]).filter(s=>s.user_id!==userId);
    own.replaceChildren();partner.replaceChildren();
    myStories.forEach(s=>option(own,s));otherStories.forEach(s=>option(partner,s));
    form.hidden=!myStories.length;
    status.textContent=myStories.length?'Choose your promotion and dates. All promotions are free.':'Publish a story first to create a promotion.';
    const today=dateISO(new Date());$('dv-promo-start').value=today;$('dv-promo-end').value=today;
    await loadLists();
  }
  async function loadLists(){
    const {data:promos,error}=await client.from('dv_promotions').select('id,owner_id,story_id,partner_story_id,kind,headline,start_date,end_date,partner_approved').order('created_at',{ascending:false}).limit(200);
    const mine=$('dv-my-promos'), requests=$('dv-pair-requests');mine.replaceChildren();requests.replaceChildren();
    if(error){mine.textContent='Promotion table is not available yet. Run the supplied SQL and enable its Data API access.';requests.textContent='';console.error(error);return;}
    const my=(promos||[]).filter(p=>p.owner_id===userId);
    for(const p of my){const item=make('div',`${p.headline} — ${p.kind} · ${p.start_date} to ${p.end_date}${p.kind==='pair'&&!p.partner_approved?' (awaiting partner approval)':''}`);item.className='dv-planner-item';
      const del=make('button','Delete');del.type='button';del.addEventListener('click',async()=>{if(!confirm('Delete this promotion?'))return;const {error}=await client.from('dv_promotions').delete().eq('id',p.id).eq('owner_id',userId);if(error)status.textContent=error.message;else await loadLists();});item.append(document.createTextNode(' '),del);mine.append(item);}
    if(!my.length)mine.textContent='No promotions submitted yet.';
    const partnerIds=new Set(myStories.map(s=>s.id));
    const pending=(promos||[]).filter(p=>p.kind==='pair'&&!p.partner_approved&&partnerIds.has(p.partner_story_id)&&p.owner_id!==userId);
    for(const p of pending){const item=make('div',`${p.headline} — requested for your story`);item.className='dv-planner-item';const approve=make('button','Approve Pair Promotion');approve.type='button';approve.onclick=async()=>{approve.disabled=true;const {data,error}=await client.rpc('dv_approve_pair_promotion',{p_promo_id:p.id});if(error||!data)status.textContent=error?.message||'Unable to approve this promotion.';else {status.textContent='Pair promotion approved.';await loadLists();}approve.disabled=false;};item.append(document.createTextNode(' '),approve);requests.append(item);}
    if(!pending.length)requests.textContent='No pending requests.';
  }
  form.addEventListener('submit',async e=>{
    e.preventDefault();const submit=$('dv-promo-submit');submit.disabled=true;
    try{
      const kind=$('dv-promo-kind').value,start=$('dv-promo-start').value,end=$('dv-promo-end').value;
      const days=(new Date(end+'T12:00:00')-new Date(start+'T12:00:00'))/86400000;
      if(!start||!end||days<0||days>31){status.textContent='Choose an end date within 31 days of the start date.';return;}
      if(kind==='pair'&&!partner.value){status.textContent='Select a partner story.';return;}
      const {error}=await client.from('dv_promotions').insert({owner_id:userId,story_id:own.value,partner_story_id:kind==='pair'?partner.value:null,kind,headline:$('dv-promo-headline').value.trim(),description:$('dv-promo-description').value.trim(),start_date:start,end_date:end});
      if(error){status.textContent='Unable to save promotion: '+error.message;return;}
      status.textContent=kind==='pair'?'Pair promotion request saved. It will appear after the partner approves.':'Promotion saved. It will appear on Discover during the selected dates.';
      await loadLists();
    }finally{submit.disabled=false;}
  });
  refresh().catch(err=>{console.error(err);status.textContent='Unable to open the promotion planner.';});
})();
