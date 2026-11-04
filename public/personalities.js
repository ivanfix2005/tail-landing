// A local style demonstration: no model calls, stored preference or account access.
export function initializePersonalities() {
  const root=document.querySelector('[data-personalities]');
  if(!root) return;
  const choices=[...root.querySelectorAll('[data-persona-choice]')];
  const objects=[...root.querySelectorAll('.persona-art [data-persona-object]')];
  const copies=[...root.querySelectorAll('[data-persona-copy]')];
  const frame=root.querySelector('.persona-selection'), group=root.querySelector('.persona-choices');
  const name=root.querySelector('[data-persona-name]'), status=root.querySelector('[role="status"]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'), effects=new Set();
  let active=0,interacted=false,observer,resizeObserver,disposed=false;
  const ease=getComputedStyle(root).getPropertyValue('--ease-out').trim() || 'cubic-bezier(.23,1,.32,1)';
  copies.forEach(copy=>{
    const quote=copy.querySelector('blockquote'), words=quote.textContent.trim().split(/\s+/);
    const fragment=document.createDocumentFragment();
    words.forEach((word,n)=>{ const span=document.createElement('span');span.className='persona-word';span.textContent=word;fragment.append(span);if(n<words.length-1) fragment.append(' '); });
    quote.replaceChildren(fragment);
  });
  const stop=()=>{ effects.forEach(a=>a.cancel());effects.clear(); };
  function play(node,frames,options) {
    if(typeof node.animate!=='function') return;
    const animation=node.animate(frames,{...options,easing:ease});effects.add(animation);
    animation.finished.then(()=>effects.delete(animation),()=>effects.delete(animation));
  }
  function placeFrame() {
    if(disposed) return;
    const base=group.getBoundingClientRect(),tile=choices[active].querySelector('.persona-tile').getBoundingClientRect();
    frame.style.width=`${tile.width+12}px`;frame.style.height=`${tile.height+12}px`;
    frame.style.transform=`translate(${tile.left-base.left}px,${tile.top-base.top}px)`;
  }
  function revealWords(index) {
    copies[index].querySelectorAll('.persona-word').forEach((word,n)=>play(word,[{opacity:0,transform:'translateY(8px)',clipPath:'inset(0 0 80% 0)'},{opacity:1,transform:'translateY(0)',clipPath:'inset(0 0 0% 0)'}],{duration:360,delay:n*14,fill:'backwards'}));
  }
  function choose(index,instant=false) {
    if(index===active) return;
    stop(); const previous=active;active=index;
    root.dataset.instant=String(instant || reduced.matches || document.hidden);root.dataset.style=choices[index].dataset.personaChoice;
    choices.forEach((button,n)=>{button.setAttribute('aria-checked',String(n===index));button.tabIndex=n===index?0:-1;});
    objects.forEach((object,n)=>{object.classList.toggle('is-active',n===index);object.classList.toggle('is-leaving',n===previous);});
    copies.forEach((copy,n)=>{copy.classList.toggle('is-active',n===index);copy.setAttribute('aria-hidden',String(n!==index));copy.inert=n!==index;});
    name.textContent=choices[index].dataset.personaTitle;placeFrame();
    if(root.dataset.instant==='false') {
      revealWords(index);
      play(name,[{opacity:.25,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:260});
    }
    status.textContent=`${name.textContent}. ${copies[index].querySelector('.persona-tone').textContent}. ${copies[index].querySelector('blockquote').textContent}`;
  }
  const click=event=>{const button=event.target.closest('[data-persona-choice]');if(!button)return;interacted=true;choose(choices.indexOf(button),event.detail===0);};
  const keydown=event=>{
    const button=event.target.closest('[data-persona-choice]');if(!button)return;
    const move={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1};let index;
    if(event.key==='Home') index=0;else if(event.key==='End')index=choices.length-1;else if(event.key in move)index=(active+move[event.key]+choices.length)%choices.length;else return;
    event.preventDefault();interacted=true;choose(index,true);choices[index].focus({preventScroll:true});
  };
  const settle=()=>{stop();root.dataset.instant='true';};
  const visibility=()=>{if(document.hidden)settle();};
  const preference=()=>{if(reduced.matches)settle();};
  root.dataset.instant='true';placeFrame();root.classList.add('has-personas');
  root.addEventListener('click',click);group.addEventListener('keydown',keydown);document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',preference);
  if('ResizeObserver' in window){resizeObserver=new ResizeObserver(placeFrame);resizeObserver.observe(group);}else addEventListener('resize',placeFrame,{passive:true});
  if('IntersectionObserver' in window){observer=new IntersectionObserver(entries=>{
    if(!entries[0].isIntersecting)return;observer.disconnect();
    if(interacted||reduced.matches||document.hidden||document.body.classList.contains('keyboard-input'))return;
    revealWords(active);play(objects[active],[{transform:'translateY(16px) rotate(-5deg) scale(.95)',opacity:.5},{transform:'translateY(0) rotate(0) scale(1)',opacity:1}],{duration:650});
  },{threshold:.4});observer.observe(root.querySelector('.personality-stage'));}
  const cleanup=()=>{disposed=true;stop();observer?.disconnect();resizeObserver?.disconnect();root.removeEventListener('click',click);group.removeEventListener('keydown',keydown);document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',preference);removeEventListener('resize',placeFrame);};
  addEventListener('pagehide',event=>{if(!event.persisted)cleanup();},{once:true});
  return cleanup;
}
