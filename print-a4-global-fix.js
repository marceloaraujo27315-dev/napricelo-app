(()=>{
  const STYLE_ID='napricelo-print-a4-global';
  const CSS=`
  @page{size:A4 portrait;margin:14mm 12mm 16mm 12mm!important}
  @media print{
    html,body{margin:0!important;padding:0!important;width:auto!important;max-width:none!important;overflow:visible!important;background:#fff!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    *,*::before,*::after{box-sizing:border-box!important}
    main,.page,.sheet,.documento,.document,.proposta,.proposal,.relatorio,.report{width:auto!important;max-width:100%!important;margin:0!important;overflow:visible!important}
    img,svg,canvas{max-width:100%!important;height:auto}
    table{width:100%!important;max-width:100%!important;border-collapse:collapse;table-layout:auto}
    th,td,p,li,span,div,h1,h2,h3,h4{overflow-wrap:anywhere;word-break:normal}
    pre,.texto,.detail-note,.observacoes{white-space:pre-wrap!important;overflow-wrap:anywhere!important}
    figure{max-width:100%!important}
    button,.acoes,.no-print,[data-no-print]{display:none!important}
  }
  `;
  function aplicar(w){
    try{
      if(!w||w.closed||!w.document)return;
      const d=w.document;
      if(!d.head)return;
      let st=d.getElementById(STYLE_ID);
      if(!st){st=d.createElement('style');st.id=STYLE_ID;st.textContent=CSS;d.head.appendChild(st)}
      // Mantém documentos gerados dentro da largura útil A4 também na visualização.
      if(d.body){d.body.style.maxWidth='100%';d.body.style.overflowX='hidden'}
    }catch(_){ }
  }
  const openBase=window.open;
  if(typeof openBase==='function'&&!openBase.__napA4){
    const wrapped=function(){
      const w=openBase.apply(window,arguments);
      if(!w)return w;
      let n=0;
      const timer=setInterval(()=>{aplicar(w);if(++n>50||w.closed)clearInterval(timer)},100);
      try{
        const closeBase=w.document.close.bind(w.document);
        w.document.close=function(){const r=closeBase();setTimeout(()=>aplicar(w),0);setTimeout(()=>aplicar(w),150);return r};
        w.addEventListener('beforeprint',()=>aplicar(w));
      }catch(_){ }
      return w;
    };
    wrapped.__napA4=true;
    window.open=wrapped;
  }
  window.NAP_PRINT_A4={aplicar};
})();
