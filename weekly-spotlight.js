(async()=>{
 const db=window.supabaseClient,wb=document.getElementById('dv-weekly-writers'),sb=document.getElementById('dv-weekly-stories');if(!db||!wb||!sb)return;
 const {data,error}=await db.rpc('dv_weekly_spotlight');if(error){wb.textContent='Weekly rankings will appear after the Spotlight SQL setup.';sb.textContent='';console.error(error);return;}
 const el=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e;};wb.replaceChildren();sb.replaceChildren();
 for(const r of data||[]){const card=el('article','');card.className='dv-weekly-card';card.append(el('h4',`#${r.position} ${r.display_title}`),el('small',`Weekly score: ${r.score}`));const a=el('a',r.category==='writer'?'View Writer':'Read Story');a.href=r.category==='writer'?'public-profile.html?id='+encodeURIComponent(r.item_id):'read-story.html?id='+encodeURIComponent(r.item_id);card.append(a);(r.category==='writer'?wb:sb).append(card);}
 if(!wb.children.length)wb.textContent='No qualifying writers last week yet.';if(!sb.children.length)sb.textContent='No qualifying stories last week yet.';
})().catch(console.error);