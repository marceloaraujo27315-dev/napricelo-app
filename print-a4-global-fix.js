(()=>{
  const STYLE_ID='napricelo-print-a4-global';
  const CSS=`
  @page{size:A4 portrait;margin:0!important}
  @media print{
    html{margin:0!important;padding:0!important;background:#fff!important}
    body{margin:0!important;padding:12mm 12mm 14mm 12mm!important;width:210mm!important;max-width:210mm!important;overflow:visible!important;background:#fff!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    *,*::before,*::after{box-sizing:border-box!important}
    main,.page,.sheet,.documento,.document,.proposta,.proposal,.relatorio,.report{width:100%!important;max-width:100%!important;margin:0!important;padding-left:0!important;padding-right:0!important;overflow:visible!important}
    img,svg,canvas{max-width:100%!important;height:auto!important}
    table{width:100%!important;max-width:100%!important;border-collapse:collapse!important;table-layout:auto!important}
    th,td,p,li,span,div,h1,h2,h3,h4{overflow-wrap:anywhere!important;word-break:normal!important}
    pre,.texto,.detail-note,.observacoes{white-space:pre-wrap!important;overflow-wrap:anywhere!important}
    figure{max-width:100%!important}
    section,.record,.card,.bloco,.equipamento{break-inside:avoid-page;page-break-inside:avoid}
    button,.acoes,.no-print,[data-no-print]{display:none!important}
  }
  `;
  function aplicar(w){
    try{
      if(!w||w.closed||!w.document)return;
      const d=w.document;
      if(!d.head)return;
      let st=d.getElementById(STYLE_ID);
      if(st)st.remove();
      st=d.createElement('style');st.id=STYLE_ID;st.textContent=CSS;d.head.appendChild(st);
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
