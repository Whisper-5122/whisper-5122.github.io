(()=>{
  const dialog=document.querySelector('.contact-qr-dialog');
  if(!dialog)return;
  let opener=null;
  document.querySelectorAll('[data-contact-qr]').forEach(button=>button.addEventListener('click',()=>{
    opener=button;
    dialog.showModal();
    document.body.classList.add('dialog-open');
    dialog.querySelector('[data-close-contact-qr]').focus();
  }));
  dialog.querySelector('[data-close-contact-qr]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  dialog.addEventListener('close',()=>{
    document.body.classList.remove('dialog-open');
    opener?.focus({preventScroll:true});
  });
})();
