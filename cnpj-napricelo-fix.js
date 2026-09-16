// Napricelo Campo - padronizacao global do CNPJ em documentos e relatorios
(()=>{
  'use strict';
  const CNPJ_CORRETO='62.660.498/0001-76';
  const VARIANTES=[
    '62.660.498/001-76',
    '62.660.498/0001-76'
  ];
  const corrigir=s=>{
    let out=String(s??'');
    for(const v of VARIANTES)out=out.split(v).join(CNPJ_CORRETO);
    return out;
  };

  // Corrige HTML gerado em novas janelas (laudos, relatórios, PDFs/impressão).
  if(!Document.prototype.__napCnpjWriteFix){
    const write=Document.prototype.write;
    Document.prototype.write=function(...args){
      return write.apply(this,args.map(a=>typeof a==='string'?corrigir(a):a));
    };
    Document.prototype.__napCnpjWriteFix=true;
  }

  // Corrige qualquer texto já exibido no aplicativo/modelos antigos renderizados na tela.
  function varrer(root=document.body){
    if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const alterar=[];
    while(walker.nextNode()){
      const n=walker.currentNode;
      if(n.nodeValue&&n.nodeValue.includes('62.660.498/001-76'))alterar.push(n);
    }
    alterar.forEach(n=>n.nodeValue=corrigir(n.nodeValue));
  }
  const iniciar=()=>{
    varrer();
    new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{
      if(n.nodeType===Node.TEXT_NODE){if(n.nodeValue?.includes('62.660.498/001-76'))n.nodeValue=corrigir(n.nodeValue);}
      else if(n.nodeType===Node.ELEMENT_NODE)varrer(n);
    }))).observe(document.documentElement,{childList:true,subtree:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();

  window.NAPRICELO_CNPJ=CNPJ_CORRETO;
})();