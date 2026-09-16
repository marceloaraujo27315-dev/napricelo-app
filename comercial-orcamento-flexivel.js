(()=>{
'use strict';
function ajustar(){
  const f=document.getElementById('orcamentoForm');
  if(!f)return false;
  f.noValidate=true;
  f.querySelectorAll('.orc-desc[required]').forEach(x=>x.removeAttribute('required'));
  const btn=f.querySelector('button.primary');if(btn)btn.disabled=false;
  if(!f.dataset.flexivelInstalado){
    f.dataset.flexivelInstalado='1';
    f.addEventListener('submit',e=>{
      const cliente=document.getElementById('orcCliente')?.value||'';
      const data=f.elements.data?.value||'';
      const itens=[...f.querySelectorAll('.orc-item')].filter(r=>{
        const desc=r.querySelector('.orc-desc')?.value?.trim();
        const qtd=Number(r.querySelector('.orc-qtd')?.value||0);
        return desc&&qtd>0;
      });
      if(!cliente){e.preventDefault();e.stopImmediatePropagation();alert('Selecione ou cadastre um cliente. Para orçamento preliminar, basta o nome do cliente; os demais dados podem ficar em branco.');return;}
      if(!data){e.preventDefault();e.stopImmediatePropagation();alert('Informe a data do orçamento.');return;}
      if(!itens.length){e.preventDefault();e.stopImmediatePropagation();alert('Inclua pelo menos um item com descrição e quantidade maior que zero.');return;}
    },true);
  }
  return true;
}
if(!ajustar()){
  const t=setInterval(()=>{if(ajustar())clearInterval(t)},250);
  setTimeout(()=>clearInterval(t),20000);
}
new MutationObserver(()=>ajustar()).observe(document.documentElement,{childList:true,subtree:true});
})();
