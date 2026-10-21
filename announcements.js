(async()=>{
 const db=window.supabaseClient,$=id=>document.getElementById(id),status=$('dv-ann-status'),feed=$('dv-ann-feed');if(!db)return;
 const {data:{user}}=await db.auth.getUser();const make=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e;};
 if(!user){$('dv-ann-editor').hidden=true;status.textContent='Log in to post announcements. You can still read recent public announcements.';}
 else {status.textContent='Announcements notify your followers. Maximum one announcement every 24 hours.';
 const {data:stories}=await db.from('stories').select('id,title').eq('user_id',user.id).eq('status','Published').limit(100);
 for(const s of stories||[]){const o=make('option',s.title);o.value=s.id;$('dv-ann-story').append(o);}
 $('dv-ann-form').onsubmit=async e=>{e.preventDefault();const b=e.currentTarget.querySelector('button');b.disabled=true;
  const payload={writer_id:user.id,story_id:$('dv-ann-story').value||null,title:$('dv-ann-title').value.trim(),body:$('dv-ann-body').value.trim()};
  const {error}=await db.from('dv_writer_announcements').insert(payload);status.textContent=error?'Could not post: '+error.message:'Announcement posted! Followers have been notified.';if(!error){e.target.reset();await loadFeed();}b.disabled=false;};}
 async function loadFeed(){const {data,error}=await db.from('dv_writer_announcements').select('id,writer_id,story_id,title,body,created_at').order('created_at',{ascending:false}).limit(40);
 feed.replaceChildren();if(error){feed.textContent='Announcements unavailable. Install the accompanying Supabase SQL.';return;}
 for(const a of data||[]){const item=make('article','');item.className='dv-ann-item';const h=make('h4',a.title),body=make('p',a.body),date=make('small',new Date(a.created_at).toLocaleString()),link=make('a','Writer profile');link.href='public-profile.html?id='+encodeURIComponent(a.writer_id);item.append(h,date,body,link);if(a.story_id){const s=make('a',' · Read story');s.href='read-story.html?id='+encodeURIComponent(a.story_id);item.append(s);}feed.append(item);}if(!data?.length)feed.textContent='No announcements yet.';}
 await loadFeed();
})().catch(console.error);