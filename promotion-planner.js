(() => {
  const client=window.supabaseClient;
  if(!client)return;
  const $=id=>document.getElementById(id);
  const status=$('dv-planner-status');
  let userId='', myStories=[], otherStories=[];
  const make=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
  function option(select,story){const opt=document.createElement('option');opt.value=story.id;opt.textContent=`${story.title} — ${story.author||'Writer'}`;select.append(opt);}
  function dateISO(d){const v=new Date(d);return `${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,'0')}-${String(v.getDate()).padStart(2,'0')}`;}
  async function refresh() {
    const {data:{user},error:authError}=await client.auth.getUser();
    if(authError||!user){status.replaceChildren(make('span','Please log in to create promotions. '));const a=make('a','Log in');a.href='login.html';status.append(a);$('dv-my-promos').textContent='Log in first.';$('dv-pair-requests').textContent='Log in first.';return;}
    userId=user.id;
    const {data:stories,error:storyError}=await client.from('stories').select('id,title,author,user_id,status').eq('status','Published').limit(300);
    if(storyError){status.textContent='Unable to load stories. Please try again.';return;}
    myStories=(stories||[]).filter(s=>s.user_id===userId);otherStories=(stories||[]).filter(s=>s.user_id!==userId);
    status.textContent=myStories.length?'Redeem a ticket below to feature one of your published stories.':'Publish a story to redeem promotion tickets.';
    await loadLists();
    await loadTickets();
  }
  async function loadTickets(){
    const box=$('dv-tickets');box.replaceChildren();
    const {data,error}=await client.from('dv_promotion_tickets').select('id,kind,earned_at,expires_at,redeemed_at').eq('writer_id',userId).order('earned_at',{ascending:false}).limit(100);
    if(error){box.textContent='Tickets unavailable. Run the promotion tickets SQL setup.';console.error(error);return;}
    const available=(data||[]).filter(t=>!t.redeemed_at&&new Date(t.expires_at).getTime()>Date.now());
    if(!available.length){box.textContent='No available tickets. Write 100+ new words or publish a chapter on consecutive days to earn one.';return;}
    for(const t of available){
      const item=document.createElement('div');item.className='dv-planner-item';
      const title=make('strong',`${t.kind==='large'?'Big':'Small'} Promotion Ticket`);
      const expiry=make('p',`Expires: ${new Date(t.expires_at).toLocaleString()}`);
      const select=document.createElement('select');select.setAttribute('aria-label','Story to promote');myStories.forEach(s=>option(select,s));
      const button=make('button','Redeem · 3-day banner');button.type='button';button.disabled=!myStories.length;
      button.onclick=async()=>{
        if(!confirm('Use this ticket once to promote your selected story for 3 days?'))return;
        button.disabled=true;
        const {error}=await client.rpc('dv_redeem_promotion_ticket',{p_ticket_id:t.id,p_story_id:select.value});
        if(error){status.textContent='Unable to redeem: '+error.message;button.disabled=false;return;}
        status.textContent='Ticket redeemed! Your story banner is now active for 3 days.';
        await loadTickets();await loadLists();
      };
      item.append(title,expiry,select,document.createTextNode(' '),button);box.append(item);
    }
  }
  async function loadLists(){
    const {data:promos,error}=await client.from('dv_promotions').select('id,owner_id,story_id,partner_story_id,kind,headline,start_date,end_date,partner_approved').order('created_at',{ascending:false}).limit(200);
    const mine=$('dv-my-promos'), requests=$('dv-pair-requests');mine.replaceChildren();requests.replaceChildren();
    if(error){mine.textContent='Promotion table is not available yet. Run the supplied SQL and enable its Data API access.';requests.textContent='';console.error(error);return;}
    const my=(promos||[]).filter(p=>p.owner_id===userId);
    for(const p of my){const item=make('div',`${p.headline} — ${p.kind} · ${p.start_date} to ${p.end_date}${p.kind==='pair'&&!p.partner_approved?' (awaiting partner approval)':''}`);item.className='dv-planner-item';
      if(p.kind!=='pair'){mine.append(item);continue;}const del=make('button','Delete');del.type='button';del.addEventListener('click',async()=>{if(!confirm('Delete this promotion?'))return;const {error}=await client.from('dv_promotions').delete().eq('id',p.id).eq('owner_id',userId);if(error)status.textContent=error.message;else await loadLists();});item.append(document.createTextNode(' '),del);mine.append(item);}
    if(!my.length)mine.textContent='No promotions submitted yet.';
    const partnerIds=new Set(myStories.map(s=>s.id));
    const pending=(promos||[]).filter(p=>p.kind==='pair'&&!p.partner_approved&&partnerIds.has(p.partner_story_id)&&p.owner_id!==userId);
    for(const p of pending){const item=make('div',`${p.headline} — requested for your story`);item.className='dv-planner-item';const approve=make('button','Approve Pair Promotion');approve.type='button';approve.onclick=async()=>{approve.disabled=true;const {data,error}=await client.rpc('dv_approve_pair_promotion',{p_promo_id:p.id});if(error||!data)status.textContent=error?.message||'Unable to approve this promotion.';else {status.textContent='Pair promotion approved.';await loadLists();}approve.disabled=false;};item.append(document.createTextNode(' '),approve);requests.append(item);}
    if(!pending.length)requests.textContent='No pending requests.';
  }
  refresh().catch(err=>{console.error(err);status.textContent='Unable to open the promotion planner.';});
})();
