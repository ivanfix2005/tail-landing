// Cached curved route; each frame only changes four small composited layers.
export function mountJourney({ ScrollTrigger, reduced, fine }) {
  const root = document.querySelector('.journey-route');
  if (!root || reduced || !fine || innerWidth < 1101) return () => {};
  const flyer = root.querySelector('.journey-flyer'), arrow = flyer.querySelector('svg');
  const streaks = [...root.querySelectorAll('.journey-streak')];
  const protectedElements = [...document.querySelectorAll('.hero-copy,.hero-float,.coverage-heading,.coverage-caption,.company-marquee,.section-intro,.market-copy,.market-phone,.market-popover,#benefits-island,.dossier,#survey,.faq-items,.faq-intro,.landing-footer')];
  const pinnedElements = [...document.querySelectorAll('.story-explanation,.story-window')];
  let samples = [], obstacles = [], pinBounds = [], length = 0, current = null;
  let frame = 0, timer = 0, previousTime = 0, disposed = false;
  const bounds = el => { const r = el.getBoundingClientRect(); return { left:r.left,right:r.right,top:r.top+scrollY,bottom:r.bottom+scrollY,height:r.height }; };
  const box = selector => bounds(document.querySelector(selector));
  function measure() {
    if (disposed) return;
    const width = document.documentElement.clientWidth, left = Math.max(37,(width-1420)/2), right = width-left;
    const intro=box('.intro-section'),coverage=box('#coverage'),story=box('.story-track'),chart=box('#company-chart');
    const benefits=box('#approach'),example=box('#example'),survey=box('#survey'),faq=box('.landing-faq');
    const anchors = [
      [width*.82,intro.top+intro.height*.62],[right,intro.bottom-25],[left,coverage.bottom+28],
      [right,story.top-40],[right,story.top+story.height*.27],[left,story.top+story.height*.61],[right,story.bottom+35],
      [left,chart.top+130],[right,chart.bottom+24],[left,benefits.top+115],[left,benefits.bottom-75],
      [right,example.top+75],[right,example.bottom-50],[left,survey.top+110],[left,survey.bottom-60],
      [right,faq.top+70],[width*.8,faq.bottom-40],
    ].sort((a,b)=>a[1]-b[1]).filter((p,i,all)=>!i||p[1]-all[i-1][1]>12);
    const next=[{x:anchors[0][0],y:anchors[0][1],distance:0}]; let distance=0;
    anchors.slice(1).forEach((b,i)=>{
      const a=anchors[i],bend=(b[1]-a[1])*.46;
      for(let n=1;n<=40;n++) {
        const t=n/40,u=1-t;
        const x=u**3*a[0]+3*u*u*t*a[0]+3*u*t*t*b[0]+t**3*b[0];
        const y=u**3*a[1]+3*u*u*t*(a[1]+bend)+3*u*t*t*(b[1]-bend)+t**3*b[1];
        const previous=next.at(-1); distance+=Math.hypot(x-previous.x,y-previous.y); next.push({x,y,distance});
      }
    });
    samples=next; length=distance; obstacles=protectedElements.map(bounds); pinBounds=pinnedElements.map(bounds);
    current=current===null?null:Math.min(current,length); root.classList.add('is-ready'); requestFrame();
  }
  function at(value,key) {
    let low=0,high=samples.length-1;
    if(value<=samples[0][key]) return samples[0]; if(value>=samples[high][key]) return samples[high];
    while(high-low>1) {const mid=(low+high)>>1;if(samples[mid][key]<value)low=mid;else high=mid;}
    const a=samples[low],b=samples[high],t=(value-a[key])/(b[key]-a[key]);
    return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,distance:a.distance+(b.distance-a.distance)*t};
  }
  function draw(time) {
    frame=0;if(disposed||document.hidden||!samples.length)return;
    const frontier=scrollY+innerHeight*.48,target=at(frontier,'y').distance;
    const dt=Math.min(48,time-(previousTime||time-16));previousTime=time;
    current=current===null?target:current+(target-current)*(1-Math.exp(-dt/60));
    const p=at(current,'distance'),a=at(Math.max(0,current-5),'distance'),b=at(Math.min(length,current+5),'distance');
    const angle=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI,screenY=p.y-scrollY;
    const blocked=obstacles.concat(pinBounds).some(r=>p.x>r.left+8&&p.x<r.right-8&&p.y>r.top+8&&p.y<r.bottom-8);
    const visible=frontier>=samples[0].y&&frontier<=samples.at(-1).y&&screenY>115&&screenY<innerHeight-40&&!blocked;
    flyer.style.transform=`translate3d(${p.x.toFixed(1)}px,${screenY.toFixed(1)}px,0)`;
    flyer.style.opacity=visible?'1':'0';arrow.style.transform=`rotate(${(angle+115).toFixed(1)}deg)`;
    streaks.forEach((streak,i)=>{
      const head=at(Math.max(0,current-24-i*48),'distance'),tail=at(Math.max(0,current-90-i*48),'distance');
      const heading=Math.atan2(head.y-tail.y,head.x-tail.x)*180/Math.PI;
      streak.style.transform=`translate3d(${head.x.toFixed(1)}px,${(head.y-scrollY).toFixed(1)}px,0) rotate(${heading.toFixed(1)}deg) scaleX(${(Math.hypot(head.x-tail.x,head.y-tail.y)/75).toFixed(3)})`;
      streak.style.opacity=visible?String(.45-i*.12):'0';
    });
    if(Math.abs(target-current)>.4)requestFrame();
  }
  function requestFrame(){if(!frame&&!disposed&&!document.hidden)frame=requestAnimationFrame(draw);}
  function onScroll(){pinBounds=pinnedElements.map(bounds);requestFrame();}
  function scheduleMeasure(){clearTimeout(timer);timer=setTimeout(measure,140);}
  const observer=new ResizeObserver(scheduleMeasure);observer.observe(document.querySelector('.site-shell'));
  addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',scheduleMeasure);
  document.addEventListener('visibilitychange',requestFrame);document.addEventListener('tail:layout-change',scheduleMeasure);
  ScrollTrigger.addEventListener('refresh',scheduleMeasure);document.fonts.ready.then(()=>{if(!disposed)scheduleMeasure();});measure();
  return ()=>{disposed=true;cancelAnimationFrame(frame);clearTimeout(timer);observer.disconnect();
    removeEventListener('scroll',onScroll);removeEventListener('resize',scheduleMeasure);
    document.removeEventListener('visibilitychange',requestFrame);document.removeEventListener('tail:layout-change',scheduleMeasure);
    ScrollTrigger.removeEventListener('refresh',scheduleMeasure);root.classList.remove('is-ready');};
}
