(()=>{
  if(window.__napRelInstPdfFix)return;window.__napRelInstPdfFix=true;
  const STYLE_ID='nap-rel-inst-pdf-fix';
  const CSS=`
@media print{
  @page{size:A4 portrait;margin:9mm!important}
  html,body{margin:0!important;padding:0!important;width:auto!important;max-width:none!important;background:#fff!important;overflow:visible!important}
  body{font-size:8.15pt!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
  .folha{width:100%!important;max-width:none!important;margin:0!important;padding:0!important;box-shadow:none!important;position:relative!important;overflow:visible!important}

  /* Paginação fixa: relatório na página 1 e fotos a partir da página 2 */
  .pagina1{page-break-after:always!important;break-after:page!important;page-break-inside:avoid!important;break-inside:avoid-page!important;min-height:0!important}
  .pagina-fotos{page-break-before:always!important;break-before:page!important;page-break-after:auto!important;break-after:auto!important;margin:0!important;min-height:0!important}

  .top{grid-template-columns:30mm 1fr 42mm!important;gap:3.5mm!important;padding-bottom:2.2mm!important;border-bottom-width:2px!important}
  .logo{font-size:16pt!important;line-height:.88!important;white-space:nowrap!important}.logo small{font-size:6.4pt!important;margin-top:1.2mm!important}
  .empresa{font-size:7.15pt!important;line-height:1.2!important}.doc b{font-size:10.5pt!important;line-height:1.02!important}.doc span{font-size:7pt!important;line-height:1.18!important}
  .sec{font-size:9.5pt!important;margin:2mm 0 .8mm!important;padding-bottom:.6mm!important;line-height:1.05!important}
  .dados{gap:0 3.5mm!important}.r{grid-template-columns:33mm 1fr!important;padding:.85mm .4mm!important;min-height:5mm!important}.r b,.r span{font-size:7.25pt!important;line-height:1.1!important}
  .checks{gap:.7mm 2.6mm!important;padding:.35mm 0!important}.ck{font-size:7.05pt!important;line-height:1.08!important}
  .obs{font-size:6.75pt!important;line-height:1.17!important;padding:1.5mm!important;min-height:0!important;border-radius:3px!important}
  .assinaturas{gap:13mm!important;margin-top:6mm!important;padding-top:0!important;break-inside:avoid!important;page-break-inside:avoid!important}.assinatura{min-height:8mm!important;padding-top:1mm!important}.assinatura strong{font-size:7.25pt!important}.assinatura small{font-size:6.3pt!important;line-height:1.1!important}
  .asscrop{width:43mm!important;height:14mm!important;bottom:7.5mm!important}.asscrop img{width:86mm!important}.asscrop.dir img{transform:translateX(-43mm)!important}
  .legal{font-size:5.75pt!important;line-height:1.17!important;margin-top:2.2mm!important;padding:1.2mm 1.6mm!important}
  .rod{font-size:5.7pt!important;margin-top:1.5mm!important;padding-top:.8mm!important;position:static!important;left:auto!important;right:auto!important;bottom:auto!important}

  .pagina-fotos .top{margin-bottom:1.6mm!important}.pagina-fotos .titulo-fotos{margin-top:1.2mm!important}.pagina-fotos .intro{font-size:6.9pt!important;line-height:1.15!important;margin:0 0 1.2mm!important}
  .pagina-fotos .fotos{display:grid!important;grid-template-columns:1fr 1fr!important;gap:2mm!important}.pagina-fotos .fotos figure{width:100%!important;margin:0!important;padding:.8mm!important;break-inside:avoid!important;page-break-inside:avoid!important}.pagina-fotos .pic{height:66mm!important}.pagina-fotos .fotos figcaption{font-size:7.5pt!important;padding:.55mm!important}
  .acoes{display:none!important}

  /* Relatórios com observações longas ganham compactação extra para não criarem página intermediária */
  .pagina1.nap-rel-longo .obs{font-size:6.15pt!important;line-height:1.11!important;padding:1.2mm!important}
  .pagina1.nap-rel-longo .sec{margin:1.6mm 0 .6mm!important}
  .pagina1.nap-rel-longo .r{padding:.65mm .35mm!important;min-height:4.5mm!important}
  .pagina1.nap-rel-longo .ck{font-size:6.7pt!important}
  .pagina1.nap-rel-longo .assinaturas{margin-top:4.5mm!important}
  .pagina1.nap-rel-longo .legal{font-size:5.4pt!important;margin-top:1.8mm!important}
}
`;
  function aplicar(w){
    try{
      if(!w||w.closed||!w.document?.head)return;
      const d=w.document;
      const titulo=(d.title||'').toLowerCase();
      if(!titulo.includes('relatório de instalação')&&!titulo.includes('relatorio de instalação')&&!titulo.includes('relatorio de instalacao'))return;
      d.getElementById(STYLE_ID)?.remove();
      const st=d.createElement('style');st.id=STYLE_ID;st.textContent=CSS;d.head.appendChild(st);
      const p1=d.querySelector('.pagina1');
      if(p1){
        const obs=p1.querySelector('.obs');
        const tam=(obs?.innerText||'').trim().length;
        p1.classList.toggle('nap-rel-longo',tam>1450);
      }
    }catch(_){ }
  }
  const base=window.open;
  if(typeof base==='function'&&!base.__napRelInstPdf){
    const wrapped=function(){
      const w=base.apply(window,arguments);if(!w)return w;
      let n=0;const t=setInterval(()=>{aplicar(w);if(++n>60||w.closed)clearInterval(t)},100);
      try{w.addEventListener('beforeprint',()=>aplicar(w));}catch(_){ }
      return w;
    };
    wrapped.__napRelInstPdf=true;window.open=wrapped;
  }
})();
