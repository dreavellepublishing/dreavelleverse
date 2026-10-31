/* DreavelleVerse birthday-only content advisory — not verified age assurance. */
window.dvR18SelfDeclarationGate = async function ({storyId,chapterNumber,chapterMeta,supabaseClient}) {
  const chapter = document.getElementById('chapter-content');
  const gate = document.createElement('section');
  gate.setAttribute('aria-label','Mature chapter warning');
  gate.style.cssText = 'padding:24px;border:1px solid #e7b9e8;border-radius:14px;background:#fff;max-width:650px;margin:16px auto;';
  const title = document.createElement('h3');
  title.textContent = '🔞 Mature Content Warning';
  title.style.color = '#873491';
  const message = document.createElement('p');
  message.textContent = 'This chapter is marked R18 and may include adult or disturbing themes. You may skip it, or enter your birthday to self-declare your age. This is not verified age assurance.';
  const controls = document.createElement('div');
  controls.style.cssText='display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;';
  const button = (label, action) => {const b=document.createElement('button');b.type='button';b.textContent=label;b.style.cssText='padding:11px 14px;border:0;border-radius:8px;background:#873491;color:white;cursor:pointer;';b.addEventListener('click',action);return b;};
  const route = n => location.href=`read-chapter.html?id=${encodeURIComponent(storyId)}&chapter=${encodeURIComponent(n)}`;
  const neighbors = async () => {
    const {data,error} = await supabaseClient.from('chapters').select('chapter_number,is_r18,content_warning_level').eq('story_id',storyId).eq('status','Published').order('chapter_number',{ascending:true});
    if(error) return {prev:null,next:null};
    const allowed=(data||[]).filter(c=>c.is_r18!==true && !String(c.content_warning_level||'').toLowerCase().includes('r18'));
    return {prev:allowed.filter(c=>Number(c.chapter_number)<chapterNumber).slice(-1)[0],next:allowed.find(c=>Number(c.chapter_number)>chapterNumber)};
  };
  const navigation = async () => {
    controls.replaceChildren();
    const {prev,next}=await neighbors();
    const add=(label,target)=>{const b=button(label,()=>{if(target)route(target.chapter_number);});if(!target)b.disabled=true;controls.append(b);};
    add('← Previous eligible chapter',prev);add('Next eligible chapter →',next);
    if(!prev&&!next){const p=document.createElement('p');p.textContent='No other eligible published chapters were found.';controls.append(p);}
  };
  const askBirthday = () => {
    controls.replaceChildren();
    const label=document.createElement('label');label.textContent='Date of birth: ';
    const input=document.createElement('input');input.type='date';input.max=new Date().toISOString().slice(0,10);input.required=true;input.style.cssText='padding:8px;margin:8px;';label.append(input);
    const feedback=document.createElement('p');feedback.setAttribute('role','status');
    controls.append(label,button('Continue',()=>{
      if(!input.value){feedback.textContent='Please enter your birthday.';return;}
      const parts=input.value.split('-').map(Number);const now=new Date();
      const birth=new Date(parts[0],parts[1]-1,parts[2]);
      if(birth.getFullYear()!==parts[0]||birth.getMonth()!==parts[1]-1||birth.getDate()!==parts[2]||birth>now){feedback.textContent='Please enter a valid past date.';return;}
      let age=now.getFullYear()-parts[0];if(now.getMonth()+1<parts[1]||(now.getMonth()+1===parts[1]&&now.getDate()<parts[2]))age--;
      if(age>=18){gate.remove();chapter.textContent='Loading chapter…';finish(true);}
      else{message.textContent='This chapter is marked R18. Please choose another eligible published chapter.';navigation();}
    }),feedback);
  };
  let finish;const promise=new Promise(resolve=>finish=resolve);
  gate.append(title,message,controls);
  chapter.replaceChildren(gate);
  controls.append(button('Skip to Next Chapter →',async()=>{
    const {next}=await neighbors();if(next)route(next.chapter_number);
    else {message.textContent='There is no next eligible published chapter. You can choose the previous one instead.';await navigation();}
  }),button('Enter My Birthday',askBirthday));

  // Hide the entire chapter-specific interface while the advisory is active.
  // The site's CSS may override the HTML hidden attribute.
  const contentParent = chapter.parentElement;
  const concealed = [];
  const keepVisible = new Set([
    chapter,
    document.getElementById('reading-chapter-title'),
    document.getElementById('reading-story-title'),
    document.getElementById('bible-verse-card')
  ]);

  if (contentParent) {
    for (const node of [...contentParent.children]) {
      if (keepVisible.has(node)) continue;

      concealed.push({
        node,
        display: node.style.getPropertyValue('display'),
        priority: node.style.getPropertyPriority('display')
      });

      node.style.setProperty('display', 'none', 'important');
    }
  }

  const ok = await promise;

  // Restore the previous display settings after adult self-declaration.
  for (const {node, display, priority} of concealed) {
    if (display) {
      node.style.setProperty('display', display, priority);
    } else {
      node.style.removeProperty('display');
    }
  }

  return ok;

};
