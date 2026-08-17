(function(){
  function instalar(){
    if(typeof window.imprimirOrdemServico !== 'function') return setTimeout(instalar,250);
    if(window.__osPrintA4Fix) return;
    window.__osPrintA4Fix=true;
    const base=window.imprimirOrdemServico;
    window.imprimirOrdemServico=async function(){
      const openOriginal=window.open;
      let popup=null;
      window.open=function(){ popup=openOriginal.apply(window,arguments); return popup; };
      try{
        const r=await base.apply(this,arguments);
        if(popup){
          const aplicar=()=>{
            try{
              if(!popup.document || !popup.document.head) return;
              if(popup.document.getElementById('nap-a4-onepage')) return;
              const st=popup.document.createElement('style');
              st.id='nap-a4-onepage';
              st.textContent=`@media print{
                @page{size:A4 portrait;margin:6mm!important}
                html,body{font-size:10.2px!important;line-height:1.18!important}
                .docwrap{width:auto!important;min-height:0!important;margin:0!important;padding:0!important}
                .cab{grid-template-columns:120px 1fr 145px!important;gap:10px!important;padding-bottom:5px!important;border-bottom-width:3px!important}
                .cab img{width:110px!important;max-height:55px!important}
                .emp{font-size:8.2px!important;line-height:1.22!important}
                .doc b{font-size:14px!important}.doc>span:not(.status){font-size:8.5px!important}
                .status{margin-top:2px!important;padding:2px 7px!important;font-size:8.5px!important}
                h2{font-size:11.5px!important;margin:6px 0 3px!important;padding-bottom:2px!important}
                .grid{gap:0 14px!important}.l{padding:2.5px 2px!important;min-height:18px!important}.l b{min-width:78px!important}
                .it{padding:3px 2px!important}.check{padding:1.2px 0!important}
                .obs,.hist{padding:4px 6px!important}.hist div+div{margin-top:3px!important;padding-top:3px!important}
                .fotos{gap:6mm!important}.fotos figure{width:calc(50% - 3mm)!important}.fotos img{height:38mm!important}
                .fotos figcaption{font-size:8px!important;margin-top:2px!important;padding:2px 4px!important}
                .assin{gap:12mm!important;margin-top:8mm!important}.assin>div{padding-top:2px!important}
                .nome{font-size:9px!important;min-height:11px!important}.rot{font-size:7.5px!important}
                .rod{margin-top:4mm!important;padding-top:3px!important;font-size:7px!important}
                .acoes{display:none!important}
              }`;
              popup.document.head.appendChild(st);
            }catch(e){console.warn('Ajuste A4 não aplicado',e);}
          };
          aplicar(); setTimeout(aplicar,150); setTimeout(aplicar,500);
        }
        return r;
      } finally { window.open=openOriginal; }
    };
  }
  instalar();
})();