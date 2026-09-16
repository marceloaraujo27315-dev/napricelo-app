(()=>{
'use strict';
const originalOpen=window.open.bind(window);
function prepararRelatorio(w){
  if(!w||w.closed)return;
  let tentativas=0;
  const timer=setInterval(()=>{
    tentativas++;
    try{
      const d=w.document;
      if(!d||!d.body){if(tentativas>80)clearInterval(timer);return;}
      const titulo=String(d.title||'');
      const pagina=d.querySelector('.pg');
      const ass=d.querySelector('.ass');
      if(!pagina||!ass){if(tentativas>80)clearInterval(timer);return;}
      if(!/^LT-/i.test(titulo)){if(tentativas>80)clearInterval(timer);return;}
      if(d.getElementById('nap-laudo-print-fix')){clearInterval(timer);return;}

      const st=d.createElement('style');
      st.id='nap-laudo-print-fix';
      st.textContent=`
        .sec{overflow:visible!important}
        .txt,.row,p,li{overflow:visible!important;max-height:none!important;word-break:normal!important;overflow-wrap:anywhere!important}
        .ass{width:90mm!important;max-width:100%!important;margin:16mm auto 0!important;text-align:center!important;position:relative!important;border-top:0!important;padding-top:19mm!important;min-height:34mm!important;break-inside:avoid!important;page-break-inside:avoid!important}
        .ass:before{content:"";position:absolute;left:50%;top:17mm;transform:translateX(-50%);width:72mm;border-top:1px solid #555}
        .lb-asscrop{position:absolute!important;top:0!important;bottom:auto!important;left:50%!important;transform:translateX(-50%)!important;width:46mm!important;height:16mm!important;overflow:hidden!important}
        .lb-asscrop img{display:block!important;width:46mm!important;height:16mm!important;object-fit:contain!important;object-position:center top!important;transform:none!important;max-width:none!important}
        @media print{
          @page{size:A4 portrait;margin:10mm}
          html,body{width:auto!important;height:auto!important;margin:0!important;padding:0!important;background:#fff!important;font-size:10.5pt!important;line-height:1.35!important;overflow:visible!important}
          .pg{width:190mm!important;max-width:190mm!important;min-height:0!important;height:auto!important;margin:0 auto!important;padding:0!important;box-shadow:none!important;overflow:visible!important}
          .head{break-after:avoid!important;page-break-after:avoid!important}
          .sec{margin-top:4mm!important;break-inside:avoid!important;page-break-inside:avoid!important;overflow:visible!important}
          .sec:has(.photos){break-inside:auto!important;page-break-inside:auto!important}
          h1,h2,h3{break-after:avoid!important;page-break-after:avoid!important}
          .grid{gap:1mm 4mm!important}
          .row{padding:1.5mm 0!important;break-inside:avoid!important;page-break-inside:avoid!important}
          .txt,p,ul,ol{margin-top:1.5mm!important;margin-bottom:1.5mm!important;orphans:3!important;widows:3!important;overflow:visible!important;max-height:none!important}
          .photos{display:grid!important;grid-template-columns:1fr 1fr!important;gap:3mm!important;align-items:start!important;overflow:visible!important}
          .photos figure{margin:0!important;padding:2mm!important;break-inside:avoid!important;page-break-inside:avoid!important;overflow:hidden!important}
          .photos img{width:100%!important;height:78mm!important;object-fit:contain!important;display:block!important}
          .photos figcaption{margin-top:1mm!important}
          .ass{margin-top:8mm!important;width:85mm!important;padding-top:18mm!important;min-height:32mm!important;break-inside:avoid!important;page-break-inside:avoid!important}
          .ass:before{top:16mm!important;width:70mm!important}
          .lb-asscrop{top:0!important;width:44mm!important;height:15mm!important}
          .lb-asscrop img{width:44mm!important;height:15mm!important;object-fit:contain!important}
          .actions{display:none!important}
        }
      `;
      d.head.appendChild(st);

      const crop=d.querySelector('.lb-asscrop');
      const img=crop?.querySelector('img');
      if(img){
        const recortar=()=>{
          try{
            const iw=img.naturalWidth, ih=img.naturalHeight;
            if(!iw||!ih)return;
            const metade=Math.floor(iw/2);
            const direita=crop.classList.contains('dir');
            const sx=direita?metade:0;
            const sw=direita?iw-metade:metade;
            // Mantém somente a faixa superior da assinatura, eliminando nomes impressos do arquivo de assinaturas.
            const sh=Math.max(1,Math.floor(ih*0.52));
            const cv=d.createElement('canvas');
            cv.width=sw;cv.height=sh;
            const ctx=cv.getContext('2d');
            ctx.drawImage(img,sx,0,sw,sh,0,0,sw,sh);
            img.src=cv.toDataURL('image/png');
            img.style.width='100%';img.style.height='100%';img.style.objectFit='contain';img.style.transform='none';
          }catch(e){console.warn('Não foi possível recortar a assinatura do laudo',e);}
        };
        if(img.complete)recortar();else img.addEventListener('load',recortar,{once:true});
      }
      clearInterval(timer);
    }catch(e){if(tentativas>80)clearInterval(timer);}
  },75);
}
window.open=function(){
  const w=originalOpen(...arguments);
  prepararRelatorio(w);
  return w;
};
})();
