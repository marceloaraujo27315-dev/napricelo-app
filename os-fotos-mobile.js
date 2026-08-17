(function(){
  function criarPreview(input, titulo){
    if(!input || input.dataset.previewInstalado==='1') return;
    input.dataset.previewInstalado='1';
    input.setAttribute('accept','image/*');
    input.setAttribute('capture','environment');
    const box=document.createElement('div');
    box.className='os-photo-preview';
    box.innerHTML=`<div class="os-photo-empty">📷 ${titulo}: nenhuma foto selecionada</div>`;
    input.insertAdjacentElement('afterend',box);
    input.addEventListener('change',()=>{
      const file=input.files&&input.files[0];
      if(!file){box.innerHTML=`<div class="os-photo-empty">📷 ${titulo}: nenhuma foto selecionada</div>`;return;}
      if(!file.type.startsWith('image/')){alert('Selecione uma imagem.');input.value='';return;}
      const url=URL.createObjectURL(file);
      box.innerHTML=`<img src="${url}" alt="Pré-visualização ${titulo}"><div class="os-photo-info"><b>${titulo}</b><span>${file.name||'Foto da câmera'}</span><button type="button" class="os-photo-remove">Remover e tirar outra</button></div>`;
      box.querySelector('.os-photo-remove')?.addEventListener('click',()=>{URL.revokeObjectURL(url);input.value='';box.innerHTML=`<div class="os-photo-empty">📷 ${titulo}: nenhuma foto selecionada</div>`;});
    });
  }
  function instalar(){
    criarPreview(document.getElementById('osFotoAntes'),'Foto antes');
    criarPreview(document.getElementById('osFotoDepois'),'Foto depois');
  }
  const obs=new MutationObserver(instalar);obs.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',instalar);instalar();
  const css=document.createElement('style');css.textContent=`
  .os-photo-preview{margin:8px 0 14px;border:1px solid #cfe0d7;border-radius:12px;background:#f7fbf9;overflow:hidden}
  .os-photo-empty{padding:13px;color:#587065;font-size:13px}
  .os-photo-preview img{display:block;width:100%;max-height:280px;object-fit:contain;background:#edf3f0}
  .os-photo-info{padding:10px 12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}.os-photo-info b{color:#176b45}.os-photo-info span{font-size:12px;color:#66776e;flex:1}.os-photo-remove{border:1px solid #d8a6a6;background:#fff5f5;color:#9b2929;border-radius:8px;padding:8px 10px;font-weight:700}
  @media(max-width:700px){.os-exec-form .photo{display:block;padding:13px;border:1px dashed #91b6a3;border-radius:12px;background:#f8fbf9}.os-exec-form .photo input[type=file]{display:block;width:100%;margin-top:9px;font-size:15px}.os-photo-preview img{max-height:360px}.os-photo-info{display:block}.os-photo-info span,.os-photo-remove{display:block;margin-top:7px}.os-photo-remove{width:100%;min-height:42px}}
  `;document.head.appendChild(css);
  if(!document.querySelector('script[data-os-print-fix]')){const s=document.createElement('script');s.src='os-print-a4-fix.js?v=1';s.dataset.osPrintFix='1';document.head.appendChild(s);}
})();