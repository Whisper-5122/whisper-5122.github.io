'use strict';
// Scroll stays native. Chapters crossfade inside a steady picture frame.
const chapterSection=document.querySelector('[data-scroll-chapters]');
if(chapterSection){
  const panels=[...chapterSection.querySelectorAll('.chapter-panel')];
  const controls=[...chapterSection.querySelectorAll('[data-chapter]')];
  const count=chapterSection.querySelector('[data-chapter-count]');
  const desktop=matchMedia('(min-width:1000px) and (min-height:650px)');
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const links=[...document.querySelectorAll('[data-section-link]')];
  const sections=links.map(link=>document.querySelector(link.hash)).filter(Boolean);
  const meter=document.querySelector('[data-reading-progress]');
  const header=document.querySelector('.site-header');
  let enhanced=false,active=-1,frame=0,currentSection=null;

  function select(index){
    if(index===active)return;
    if(enhanced&&active>=0&&panels[active].contains(document.activeElement))controls[index].focus({preventScroll:true});
    active=index;
    controls.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
    count.textContent=String(index+1).padStart(2,'0');
    panels.forEach((panel,i)=>{
      panel.classList.toggle('is-current',i===index);
      panel.inert=enhanced&&i!==index;
      if(enhanced&&i!==index)panel.setAttribute('aria-hidden','true');else panel.removeAttribute('aria-hidden');
    });
  }

  function paint(){
    frame=0;
    // Finish geometry reads before changing styles, focus or accessibility state.
    const headerHeight=header.getBoundingClientRect().height;
    const rect=enhanced?chapterSection.getBoundingClientRect():null;
    const readingRange=document.documentElement.scrollHeight-innerHeight;
    const readingProgress=Math.max(0,Math.min(1,scrollY/Math.max(1,readingRange)));
    let current=null;
    for(const section of sections)if(section.getBoundingClientRect().top<=headerHeight+innerHeight*.3)current=section.id;
    if(enhanced){
      const travel=rect.height-(innerHeight-headerHeight);
      const progress=Math.max(0,Math.min(1,(headerHeight-rect.top)/Math.max(1,travel)));
      const index=Math.min(panels.length-1,Math.round(progress*(panels.length-1)));
      select(index);
      chapterSection.classList.add('is-chapter-ready');
    }
    if(meter)meter.style.transform='scaleX('+readingProgress+')';
    if(current!==currentSection){
      currentSection=current;
      links.forEach(link=>{if(link.hash==='#'+current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
    }
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(paint);}
  function configure(){
    chapterSection.classList.remove('is-chapter-ready');
    enhanced=desktop.matches&&!reduced.matches;
    chapterSection.classList.toggle('is-scroll-enhanced',enhanced);
    active=-1;
    select(0);schedule();
  }
  controls.forEach((button,index)=>button.addEventListener('click',()=>{
    const headerHeight=header.getBoundingClientRect().height;
    if(enhanced){
      const travel=chapterSection.offsetHeight-(innerHeight-headerHeight);
      const target=chapterSection.getBoundingClientRect().top+scrollY-headerHeight+travel*index/(panels.length-1);
      // The page moves instantly; only the chapter content needs a transition.
      scrollTo({top:target,behavior:'instant'});
    }else panels[index].scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});
  }));
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  document.addEventListener('whisper:position-restored',()=>{if(frame)cancelAnimationFrame(frame);paint();});
  desktop.addEventListener('change',configure);reduced.addEventListener('change',configure);
  configure();
}

const cinema=document.querySelector('.cinema-video');
const cinemaPlay=document.querySelector('[data-cinema-play]');
if(cinema&&cinemaPlay){
  function updateCinema(){
    const playing=!cinema.paused;
    cinemaPlay.setAttribute('aria-pressed',String(playing));
    cinemaPlay.setAttribute('aria-label',playing?'暂停作品片段':'播放作品片段');
    cinemaPlay.querySelector('span').textContent=playing?'暂停片段':'播放片段';
    cinemaPlay.querySelector('svg').innerHTML=playing?'<path d="M7 5h3v14H7zm7 0h3v14h-3Z" fill="currentColor"/>':'<path d="m8 5 12 7-12 7V5Z" fill="currentColor"/>';
  }
  cinemaPlay.addEventListener('click',async()=>{
    if(cinema.paused){
      document.querySelectorAll('video').forEach(video=>{if(video!==cinema)video.pause();});
      try{await cinema.play();}catch{document.querySelector('[data-cinema-status]').textContent='暂时无法播放，请从影像详情页重试。';}
    }else cinema.pause();
  });
  cinema.addEventListener('play',updateCinema);cinema.addEventListener('pause',updateCinema);
  cinema.addEventListener('error',()=>{document.querySelector('[data-cinema-status]').textContent='片段无法载入，请从影像详情页重试。';});
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)cinema.pause();},{threshold:0}).observe(cinema);
  updateCinema();
}
