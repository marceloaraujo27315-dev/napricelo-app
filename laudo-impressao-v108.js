(()=>{
'use strict';
const abrirOriginal=window.open.bind(window);
const assinaturaMarcelo=new URL('assinatura-marcelo.svg',location.href).href;
function ajustarLaudo(w){
  try{
    const d=w.document;
    if(!d||!/^LT-/i.test(d.title||''))return;
    if(d.getElementById('napricelo-print-v108'))return;
    const st=d.createElement('style');
    st.id='napricelo-print-v108';
    st.textContent=`
      @page{size:A4 portrait;margin:18mm 15mm 18mm 15mm}
      @media print{
        html,body{margin:0!important;padding:0!important;background:#fff!important}
        .pg{width:auto!important;min-height:0!important;margin:0!important;padding:0!important;box-shadow:none!important}
        .actions{display:none!important}
        .sec{margin-top:5mm!important;break-inside:auto!important;page-break-inside:auto!important}
        .sec h2{break-after:avoid-page!important;page-break-after:avoid!important;margin-bottom:2mm!important}
        .grid,.row,.txt,ul{max-width:100%!important;overflow:visible!important}
        .txt{white-space:pre-wrap!important;word-break:normal!important;overflow-wrap:anywhere!important;line-height:1.45!important}
        .photos{display:grid!important;grid-template-columns:1fr 1fr!important;grid-template-rows:auto auto!important;gap:5mm!important;break-before:page!important;page-break-before:always!important;break-inside:avoid-page!important;page-break-inside:avoid!important}
        .photos figure{height:88mm!important;margin:0!important;padding:2mm!important;display:flex!important;flex-direction:column!important;justify-content:space-between!important;break-inside:avoid!important;page-break-inside:avoid!important}
        .photos img{width:100%!important;height:79mm!important;max-height:79mm!important;object-fit:contain!important}
        .photos figcaption{font-size:9px!important;line-height:1.15!important;margin-top:1mm!important}
        .ass{margin-top:10mm!important;padding-top:16mm!important;break-inside:avoid!important;page-break-inside:avoid!important}
        .ass::before{top:14mm!important;width:75mm!important}
        .lb-asscrop{width:75mm!important;height:14mm!important;top:0!important;bottom:auto!important;overflow:visible!important}
        .lb-asscrop img{display:block!important;width:75mm!important;height:14mm!important;object-fit:contain!important;object-position:center center!important;transform:none!important;max-width:75mm!important}
      }
    `;
    d.head.appendChild(st);
    const ass=d.querySelector('.ass');
    const nome=(ass?.querySelector('b')?.textContent||'').trim().toLowerCase();
    const img=ass?.querySelector('.lb-asscrop img');
    if(img&&nome.includes('marcelo de araujo santos')){
      img.src=assinaturaMarcelo;
      img.style.transform='none';
      img.style.width='75mm';
      img.style.height='14mm';
      img.style.objectFit='contain';
      img.style.objectPosition='center';
      img.closest('.lb-asscrop')?.classList.remove('dir');
    }
  }catch(e){console.warn('Ajuste de impressão do laudo não aplicado',e);}
}
window.open=function(){
  const w=abrirOriginal(...arguments);
  if(!w)return w;
  try{
    const fechar=w.document.close.bind(w.document);
    w.document.close=function(){
      const r=fechar();
      setTimeout(()=>ajustarLaudo(w),30);
      setTimeout(()=>ajustarLaudo(w),250);
      return r;
    };
  }catch(_){ }
  return w;
};
})();