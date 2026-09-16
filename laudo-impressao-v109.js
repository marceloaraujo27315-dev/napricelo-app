(()=>{
'use strict';
const originalOpen=window.open.bind(window);
function preparar(w){
  if(!w||w.closed)return;
  let tent=0;
  const timer=setInterval(()=>{
    tent++;
    try{
      const d=w.document;if(!d?.body){if(tent>80)clearInterval(timer);return;}
      if(!/^LT-/i.test(String(d.title||''))){if(tent>80)clearInterval(timer);return;}
      const pg=d.querySelector('.pg'),ass=d.querySelector('.ass');
      if(!pg||!ass){if(tent>80)clearInterval(timer);return;}
      if(d.getElementById('nap-laudo-print-v109')){clearInterval(timer);return;}
      const st=d.createElement('style');st.id='nap-laudo-print-v109';st.textContent=`
        .sec,.txt,.row,p,li{overflow:visible!important;max-height:none!important}
        .txt,p,li{word-break:normal!important;overflow-wrap:break-word!important}
        .pg{padding-left:17mm!important;padding-right:17mm!important}
        .ass{width:92mm!important;max-width:100%!important;margin:10mm auto 0!important;text-align:center!important;position:relative!important;border:0!important;padding:0!important;min-height:34mm!important;break-inside:avoid!important;page-break-inside:avoid!important}
        .ass:before{display:none!important}
        .lb-asscrop{position:static!important;transform:none!important;width:68mm!important;height:22mm!important;margin:0 auto 2mm!important;overflow:visible!important}
        .lb-asscrop img{display:block!important;width:68mm!important;height:22mm!important;object-fit:contain!important;object-position:center!important;transform:none!important;max-width:68mm!important;margin:0 auto!important}
        .ass:after{content:"";display:block;width:60mm;margin:0 auto 2mm;border-top:1px solid #444}
        @media print{
          @page{size:A4 portrait;margin:17mm 15mm 16mm 15mm}
          html,body{margin:0!important;padding:0!important;background:#fff!important;overflow:visible!important;font-size:9.7pt!important;line-height:1.44!important}
          .pg{width:auto!important;max-width:none!important;min-height:0!important;height:auto!important;margin:0!important;padding:0 3mm!important;box-shadow:none!important;overflow:visible!important}
          .head{break-after:avoid!important;page-break-after:avoid!important}
          .sec{margin-top:4mm!important;overflow:visible!important}
          h1,h2,h3{break-after:avoid!important;page-break-after:avoid!important}
          .grid{gap:1.2mm 4mm!important}
          .row{padding:1.4mm 0!important;break-inside:avoid!important;page-break-inside:avoid!important}
          .txt,p,ul,ol{margin-top:1.5mm!important;margin-bottom:1.5mm!important;orphans:3!important;widows:3!important}
          .sec:has(.photos){break-before:page!important;page-break-before:always!important;break-inside:avoid!important;page-break-inside:avoid!important;margin-top:0!important}
          .photos{display:grid!important;grid-template-columns:1fr 1fr!important;grid-template-rows:auto auto!important;gap:3mm!important;align-items:start!important;break-inside:avoid!important;page-break-inside:avoid!important}
          .photos figure{margin:0!important;padding:1.5mm!important;break-inside:avoid!important;page-break-inside:avoid!important;overflow:hidden!important}
          .photos img{display:block!important;width:100%!important;height:55mm!important;object-fit:contain!important;margin:0 auto!important}
          .photos figcaption{margin-top:1mm!important;font-size:8.5pt!important}
          .ass{margin-top:7mm!important;width:88mm!important;min-height:32mm!important;break-inside:avoid!important;page-break-inside:avoid!important}
          .lb-asscrop{width:66mm!important;height:21mm!important;margin-bottom:2mm!important;overflow:visible!important}
          .lb-asscrop img{width:66mm!important;height:21mm!important;object-fit:contain!important;object-position:center!important}
          .ass:after{width:58mm!important;margin-bottom:2mm!important}
          .actions{display:none!important}
        }
      `;
      d.head.appendChild(st);
      const crop=ass.querySelector('.lb-asscrop');
      const img=crop?.querySelector('img');
      if(img&&/Marcelo de Araujo Santos/i.test(ass.textContent||'')){
        img.src=new URL('assinatura-marcelo.svg',location.href).href;
        img.removeAttribute('srcset');
        img.style.width='66mm';img.style.height='21mm';img.style.objectFit='contain';img.style.objectPosition='center';img.style.transform='none';
      }
      clearInterval(timer);
    }catch(e){if(tent>80)clearInterval(timer);}
  },75);
}
window.open=function(){const w=originalOpen(...arguments);preparar(w);return w;};
})();