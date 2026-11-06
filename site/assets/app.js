'use strict';
const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
const safeSession={
  get(key){try{return sessionStorage.getItem(key);}catch{return null;}},
  set(key,value){try{sessionStorage.setItem(key,value);}catch{}},
  remove(key){try{sessionStorage.removeItem(key);}catch{}}
};
const menu=$('.menu-toggle');
function closeMenu(){if(menu){menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','打开导航菜单');document.body.classList.remove('menu-open');}}
if(menu){
  menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'关闭导航菜单':'打开导航菜单');document.body.classList.toggle('menu-open',open);});
  $$('#site-nav a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus();}});
}
function showToast(text){const el=$('.toast');if(!el)return;el.textContent=text;el.hidden=false;clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>{el.hidden=true;},3500);}
$$('[data-copy-url]').forEach(button=>button.addEventListener('click',async()=>{
  const status=$('.copy-status');let copied=false;
  try{await navigator.clipboard.writeText(location.href.split('#')[0]);copied=true;}catch{}
  if(copied){button.firstChild.textContent='链接已复制';if(status)status.textContent='可以将链接分享给想认识你的人。';setTimeout(()=>{button.firstChild.textContent='复制网站链接';},2500);}
  else if(status)status.textContent='当前浏览器未允许复制，请从地址栏复制网站链接。';
}));

// Each destination remembers its own entry point, including nested project → awards visits.
function siteRoute(value){
  try{
    const url=new URL(value,location.href);
    if(url.origin!==location.origin||!/^\/(?:index(?:\.html)?|images(?:\.html)?|awards(?:\.html)?|projects\/[a-zA-Z0-9_-]+(?:\.html)?)?\/?$/.test(url.pathname))return null;
    const page=url.pathname.replace(/\.html$/,'').replace(/\/index$/,'/').replace(/\/$/,'')||'/';
    return {url,page};
  }catch{return null;}
}
function readPosition(key){
  try{const value=JSON.parse(safeSession.get(key));if(value&&siteRoute(value.url)&&Number.isFinite(value.scrollY)&&value.scrollY>=0)return value;}catch{}
  return null;
}
const currentRoute=siteRoute(location.href);
const entryKey=currentRoute?'whisper:entry:'+currentRoute.page:null;
document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const link=event.target.closest('a[href]');
  if(!link||link.hasAttribute('data-back-to-work')||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return;
  const target=siteRoute(link.href);
  if(!currentRoute||!target||target.page===currentRoute.page)return;
  const matching=$$('a[href]').filter(a=>a.href===link.href);
  safeSession.set('whisper:entry:'+target.page,JSON.stringify({url:location.pathname+location.search+location.hash,scrollY:scrollY,focusHref:link.href,focusIndex:matching.indexOf(link)}));
});
$$('[data-back-to-work]').forEach(link=>{
  const previous=entryKey?readPosition(entryKey):null;
  if(previous&&siteRoute(previous.url).page!==currentRoute.page){
    link.href=previous.url;
    link.dataset.returnScroll=String(previous.scrollY);
  }
  link.addEventListener('click',event=>{
    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    if(previous&&siteRoute(link.href)?.page===siteRoute(previous.url).page)safeSession.set('whisper:restore-position',JSON.stringify(previous));
  });
});
function restoreEntryPosition(){
  const previous=readPosition('whisper:restore-position');
  if(!previous||!currentRoute||siteRoute(previous.url).page!==currentRoute.page)return;
  safeSession.remove('whisper:restore-position');
  // Run after pageshow so fonts, fragment navigation and pinned chapters have settled.
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const matches=$$('a[href]').filter(a=>a.href===previous.focusHref);
    matches[previous.focusIndex||0]?.focus({preventScroll:true});
    window.scrollTo({top:previous.scrollY,behavior:'instant'});
  }));
}
window.addEventListener('pageshow',restoreEntryPosition);

const gallery=$('.gallery-dialog');
if(gallery){
  let trigger=null;
  $$('[data-gallery-image]').forEach(button=>button.addEventListener('click',()=>{
    trigger=button;const img=$('.gallery-canvas img',gallery);img.src=button.dataset.galleryImage;img.alt=button.dataset.galleryAlt||'作品大图';$('.gallery-caption',gallery).textContent=img.alt;
    gallery.showModal();document.body.classList.add('dialog-open');$('[data-close-gallery]',gallery).focus();
  }));
  function close(){gallery.close();}
  $('[data-close-gallery]',gallery).addEventListener('click',close);
  gallery.addEventListener('click',event=>{if(event.target===gallery)close();});
  gallery.addEventListener('close',()=>{document.body.classList.remove('dialog-open');if(trigger)trigger.focus();});
}
$$('video').forEach(video=>video.addEventListener('error',()=>{const status=$('.video-error');if(status)status.hidden=false;}));
document.addEventListener('visibilitychange',()=>{if(document.hidden)$$('video').forEach(video=>video.pause());});
$$('.media-frame img').forEach(img=>img.addEventListener('error',()=>{
  const frame=img.closest('.media-frame');if(frame.classList.contains('media-error'))return;frame.classList.add('media-error');
  const message=document.createElement('span');message.className='media-error-message';message.textContent='图像暂时无法载入，请刷新页面重试。';frame.append(message);
}));

// The hero switches between architecture and a linked film cover without loading video.
const sceneButtons=$$('[data-scene]');
if(sceneButtons.length){
  const stage=$('[data-scene-stage]');
  sceneButtons.forEach(button=>button.addEventListener('click',()=>{
    const film=button.dataset.scene==='film';
    sceneButtons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    $('#scene-architecture').hidden=film;$('#scene-film').hidden=!film;
    $('[data-scene-caption] strong').textContent=film?stage.dataset.filmTitle:stage.dataset.architectureTitle;
    $('[data-scene-caption] span').textContent=film?'AIGC 影像 / 视频号完整版':'建筑设计 / '+stage.dataset.architectureMedium;
    $('[data-scene-status]').textContent=film?'已切换到影像封面。点击封面前往视频号观看。':'已切换到建筑空间。';
  }));
}

const filmQR=$('.film-qr-dialog');
if(filmQR){
  let opener=null;
  $$('[data-film-qr]').forEach(button=>button.addEventListener('click',()=>{
    opener=button;
    $('#film-qr-title',filmQR).textContent=button.dataset.filmTitle;
    const img=$('[data-film-qr-image]',filmQR);img.src=button.dataset.filmQr;img.alt=button.dataset.filmTitle+'视频号二维码';
    $('[data-film-qr-link]',filmQR).href=button.dataset.filmUrl;
    filmQR.showModal();document.body.classList.add('dialog-open');$('[data-close-film-qr]',filmQR).focus();
  }));
  $('[data-close-film-qr]',filmQR).addEventListener('click',()=>filmQR.close());
  filmQR.addEventListener('click',event=>{if(event.target===filmQR)filmQR.close();});
  filmQR.addEventListener('close',()=>{document.body.classList.remove('dialog-open');if(opener)opener.focus();});
}
