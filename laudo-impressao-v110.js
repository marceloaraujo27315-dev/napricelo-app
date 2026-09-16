(()=>{
'use strict';
const nativeOpen=window.open.bind(window);
function preparar(w){
  if(!w||w.closed)return;
  let n=0;
  const t=setInterval(()=>{
    n++;
    try{
      const d=w.document;
      if(!d?.body){if(n>100)clearInterval(t);return;}
      if(!/^LT-/i.test(String(d.title||''))){if(n>100)clearInterval(t);return;}
      const pg=d.querySelector('.pg'), photos=d.querySelector('.photos'), ass=d.querySelector('.ass');
      if(!pg||!photos||!ass){if(n>100)clearInterval(t);return;}
      if(d.getElementById('nap-laudo-print-v110')){clearInterval(t);return;}

      const fotoSec=photos.closest('.sec')||photos.parentElement;
      if(fotoSec){
        fotoSec.classList.add('nap-photo-sec');
        if(ass.parentElement!==fotoSec)fotoSec.appendChild(ass);
      }

      const assTxt=ass.textContent||'';
      const crop=ass.querySelector('.lb-asscrop');
      const img=crop?.querySelector('img');
      if(img && /Marcelo de Araujo Santos/i.test(assTxt)){
        img.src=new URL('assinatura-marcelo.svg',location.href).href;
        img.removeAttribute('srcset');
      }

      const st=d.createElement('style');
      st.id='nap-laudo-print-v110';
      st.textContent=`
        .sec,.txt,.row,p,li{overflow:visible!important;max-height:none!important}
        .txt,p,li{word-break:normal!important;overflow-wrap:break-word!important}
        .ass{width:84mm!important;max-width:100%!important;margin:6mm auto 0!important;text-align:center!important;position:relative!important;border:0!important;padding:0!important;min-height:26mm!important;break-inside:avoid!important;page-break-inside:avoid!important}
        .ass:before{display:none!important}
        .lb-asscrop{position:static!important;left:auto!important;top:auto!important;bottom:auto!important;transform:none!important;width:62mm!important;height:18mm!important;margin:0 auto 2mm!important;overflow:visible!important}
        .lb-asscrop img{display:block!important;width:62mm!important;height:18mm!important;max-width:62mm!important;object-fit:contain!important;object-position:center!important;transform:none!important;margin:0 auto!important}
        .ass:after{content:"";display:block;width:58mm;margin:0 auto 2mm;border-top:1px solid #444}
        @media screen{
          .pg{padding-left:16mm!important;padding-right:16mm!important}
        }
        @media print{
          @page{size:A4 portrait;margin:16mm 15mm 16mm 15mm}
          html,body{margin:0!important;padding:0!important;background:#fff!important;overflow:visible!important;font-size:9.6pt!important;line-height:1.4!important}
          .pg{width:auto!important;max-width:none!important;min-height:0!important;height:auto!important;margin:0!important;padding:0!important;box-shadow:none!important;overflow:visible!important}
          .head{break-after:avoid!important;page-break-after:avoid!important}
          .sec{margin-top:4mm!important;overflow:visible!important;break-inside:auto!important;page-break-inside:auto!important}
          h1,h2,h3{break-after:avoid!important;page-break-after:avoid!important}
          .grid{gap:1mm 4mm!important}
          .row{padding:1.3mm 0!important;break-inside:avoid!important;page-break-inside:avoid!important}
          .txt,p,ul,ol{margin-top:1.4mm!important;margin-bottom:1.4mm!important;orphans:3!important;widows:3!important}
          .nap-photo-sec{break-before:page!important;page-break-before:always!important;break-inside:avoid!important;page-break-inside:avoid!important;margin-top:0!important;padding-top:0!important}
          .nap-photo-sec>h2{margin-top:0!important;margin-bottom:2.5mm!important}
          .photos{display:grid!important;grid-template-columns:1fr 1fr!important;grid-template-rows:auto auto!important;gap:3mm!important;align-items:start!important;break-inside:avoid!important;page-break-inside:avoid!important;margin:0!important}
          .photos figure{margin:0!important;padding:1.5mm!important;break-inside:avoid!important;page-break-inside:avoid!important;overflow:hidden!important}
          .photos img{display:block!important;width:100%!important;height:48mm!important;object-fit:contain!important;margin:0 auto!important}
          .photos figcaption{margin-top:1mm!important;font-size:8.2pt!important;line-height:1.15!important}
          .ass{margin-top:5mm!important;width:80mm!important;min-height:25mm!important}
          .lb-asscrop{width:60mm!important;height:17mm!important;margin-bottom:1.5mm!important}
          .lb-asscrop img{width:60mm!important;height:17mm!important;max-width:60mm!important;object-fit:contain!important}
          .ass:after{width:56mm!important;margin-bottom:1.5mm!important}
          .actions{display:none!important}
        }
      `;
      d.head.appendChild(st);
      clearInterval(t);
    }catch(e){if(n>100)clearInterval(t);}
  },60);
}
window.open=function(){const w=nativeOpen(...arguments);preparar(w);return w;};
})();
