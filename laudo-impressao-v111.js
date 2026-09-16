(()=>{
'use strict';
const baseOpen=window.open.bind(window);
function preparar(w){
  if(!w||w.closed)return;
  let tent=0;
  const timer=setInterval(()=>{
    tent++;
    try{
      const d=w.document;
      if(!d?.body){if(tent>100)clearInterval(timer);return;}
      if(!/^LT-/i.test(String(d.title||''))){if(tent>100)clearInterval(timer);return;}
      const pg=d.querySelector('.pg'), photos=d.querySelector('.photos'), ass=d.querySelector('.ass');
      if(!pg||!photos||!ass){if(tent>100)clearInterval(timer);return;}
      if(d.getElementById('nap-laudo-print-v111')){clearInterval(timer);return;}

      // Mantém responsabilidade técnica junto do registro fotográfico.
      const photoSec=photos.closest('.sec');
      const respH=[...d.querySelectorAll('h2,h3')].find(h=>/RESPONSABILIDADE\s*T[EÉ]CNICA/i.test(h.textContent||''));
      const respSec=respH?.closest('.sec');
      if(photoSec&&respSec&&photoSec!==respSec) photoSec.appendChild(respSec);

      // Assinatura individual do Marcelo.
      const crop=ass.querySelector('.lb-asscrop');
      const img=crop?.querySelector('img');
      if(img&&/Marcelo de Araujo Santos/i.test(ass.textContent||'')){
        img.src=new URL('assinatura-marcelo.svg',location.href).href;
        img.removeAttribute('srcset');
      }

      const st=d.createElement('style');
      st.id='nap-laudo-print-v111';
      st.textContent=`
        .sec,.txt,.row,p,li{max-height:none!important;overflow:visible!important}
        .txt,p,li{word-break:normal!important;overflow-wrap:break-word!important}
        .ass{position:static!important;width:82mm!important;max-width:100%!important;min-height:0!important;margin:6mm auto 0!important;padding:0!important;border:0!important;text-align:center!important;break-inside:avoid!important;page-break-inside:avoid!important}
        .ass:before{display:none!important}
        .lb-asscrop{position:static!important;left:auto!important;top:auto!important;bottom:auto!important;transform:none!important;width:60mm!important;height:17mm!important;margin:0 auto 1.5mm!important;overflow:visible!important}
        .lb-asscrop img{display:block!important;width:60mm!important;height:17mm!important;max-width:60mm!important;object-fit:contain!important;object-position:center!important;transform:none!important;margin:0 auto!important}
        .ass:after{content:"";display:block;width:58mm;border-top:1px solid #444;margin:0 auto 1.5mm!important}
        @media screen{
          .pg{padding-left:18mm!important;padding-right:18mm!important}
        }
        @media print{
          @page{size:A4 portrait;margin:17mm 15mm 17mm 15mm}
          html,body{margin:0!important;padding:0!important;background:#fff!important;overflow:visible!important;font-size:9.7pt!important;line-height:1.42!important}
          .pg{width:auto!important;max-width:none!important;min-height:0!important;height:auto!important;margin:0!important;padding:0 1mm!important;box-shadow:none!important;overflow:visible!important}
          .head{break-after:avoid!important;page-break-after:avoid!important}
          h1,h2,h3{break-after:avoid!important;page-break-after:avoid!important}
          .sec{margin-top:4mm!important;overflow:visible!important}
          .sec:not(:has(.photos)){break-inside:avoid!important;page-break-inside:avoid!important}
          .grid,.row{break-inside:avoid!important;page-break-inside:avoid!important}
          .row{padding:1.4mm 0!important}
          .txt,p,ul,ol{margin-top:1.4mm!important;margin-bottom:1.4mm!important;orphans:3!important;widows:3!important}
          .sec:has(.photos){break-before:page!important;page-break-before:always!important;break-inside:avoid!important;page-break-inside:avoid!important;margin-top:0!important}
          .photos{display:grid!important;grid-template-columns:1fr 1fr!important;grid-template-rows:auto auto!important;gap:3mm!important;align-items:start!important;break-inside:avoid!important;page-break-inside:avoid!important}
          .photos figure{margin:0!important;padding:1.5mm!important;break-inside:avoid!important;page-break-inside:avoid!important;overflow:hidden!important}
          .photos img{display:block!important;width:100%!important;height:50mm!important;object-fit:contain!important;margin:0 auto!important}
          .photos figcaption{margin-top:1mm!important;font-size:8.2pt!important}
          .sec:has(.photos) .sec{margin-top:5mm!important;break-inside:avoid!important;page-break-inside:avoid!important}
          .ass{width:78mm!important;margin-top:4mm!important}
          .lb-asscrop{width:58mm!important;height:16mm!important;margin-bottom:1mm!important}
          .lb-asscrop img{width:58mm!important;height:16mm!important;max-width:58mm!important}
          .ass:after{width:56mm!important;margin-bottom:1mm!important}
          .actions{display:none!important}
        }
      `;
      d.head.appendChild(st);
      clearInterval(timer);
    }catch(e){if(tent>100)clearInterval(timer);}
  },60);
}
window.open=function(){const w=baseOpen(...arguments);preparar(w);return w;};
})();
