(()=>{
  if(window.__napRelInstPdfFixV2)return;window.__napRelInstPdfFixV2=true;
  const STYLE_ID='nap-rel-inst-pdf-fix';
  const CSS=`
.logo{display:flex!important;align-items:center!important;gap:9px!important;min-width:0!important;white-space:nowrap!important;overflow:visible!important}
.logo .nap-logo-img{width:42px!important;height:42px!important;flex:0 0 42px!important;display:block!important}
.logo .nap-logo-txt{display:flex!important;flex-direction:column!important;min-width:0!important;line-height:1!important}
.logo .nap-logo-nome{font-size:23px!important;font-weight:800!important;letter-spacing:.2px!important;color:#176b45!important;white-space:nowrap!important}
.logo .nap-logo-sub{font-size:9px!important;font-weight:700!important;color:#698077!important;margin-top:4px!important;white-space:nowrap!important;letter-spacing:.3px!important}
.top{align-items:center!important}
@media print{
  @page{size:A4 portrait;margin:9mm!important}
  html,body{margin:0!important;padding:0!important;width:auto!important;max-width:none!important;background:#fff!important;overflow:visible!important}
  body{font-size:8.4pt!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
  .folha{width:100%!important;max-width:none!important;margin:0!important;padding:0!important;box-shadow:none!important;min-height:0!important;position:relative!important;overflow:visible!important}
  .pagina1{page-break-after:always!important;break-after:page!important;min-height:0!important}
  .pagina-fotos{page-break-before:always!important;break-before:page!important;margin:0!important;min-height:0!important}
  .top{grid-template-columns:42mm 1fr 43mm!important;gap:4mm!important;padding-bottom:2.6mm!important;border-bottom-width:2px!important;align-items:center!important}
  .logo{display:flex!important;align-items:center!important;gap:2.2mm!important;white-space:nowrap!important;overflow:visible!important;min-width:0!important}
  .logo .nap-logo-img{width:12mm!important;height:12mm!important;flex:0 0 12mm!important;display:block!important}
  .logo .nap-logo-txt{display:flex!important;flex-direction:column!important;min-width:0!important;line-height:1!important}
  .logo .nap-logo-nome{font-size:13.2pt!important;font-weight:800!important;letter-spacing:.05mm!important;color:#176b45!important;white-space:nowrap!important}
  .logo .nap-logo-sub{font-size:5.8pt!important;font-weight:700!important;color:#698077!important;margin-top:1mm!important;white-space:nowrap!important;letter-spacing:.08mm!important}
  .empresa{font-size:7.5pt!important;line-height:1.23!important}.doc b{font-size:11pt!important;line-height:1.05!important}.doc span{font-size:7.4pt!important;line-height:1.25!important}
  .sec{font-size:10pt!important;margin:2.4mm 0 1mm!important;padding-bottom:.8mm!important;line-height:1.1!important}
  .dados{gap:0 4mm!important}.r{grid-template-columns:35mm 1fr!important;padding:1.1mm .5mm!important;min-height:5.8mm!important}.r b,.r span{font-size:7.8pt!important;line-height:1.15!important}
  .checks{gap:1mm 3mm!important;padding:.5mm 0!important}.ck{font-size:7.6pt!important;line-height:1.15!important}
  .obs{font-size:7.25pt!important;line-height:1.23!important;padding:2mm!important;min-height:0!important;border-radius:3px!important}
  .assinaturas{gap:15mm!important;margin-top:10mm!important;padding-top:0!important;break-inside:avoid!important;page-break-inside:avoid!important}.assinatura{min-height:10mm!important;padding-top:1.2mm!important}.assinatura strong{font-size:7.8pt!important}.assinatura small{font-size:6.8pt!important;line-height:1.15!important}
  .asscrop{width:46mm!important;height:16mm!important;bottom:9mm!important}.asscrop img{width:92mm!important}.asscrop.dir img{transform:translateX(-46mm)!important}
  .legal{font-size:6.15pt!important;line-height:1.25!important;margin-top:3mm!important;padding:1.5mm 2mm!important}
  .rod{font-size:6pt!important;margin-top:2mm!important;padding-top:1mm!important;position:static!important;left:auto!important;right:auto!important;bottom:auto!important}
  .pagina-fotos .top{margin-bottom:2mm!important}.pagina-fotos .titulo-fotos{margin-top:1.5mm!important}.pagina-fotos .intro{font-size:7.2pt!important;line-height:1.2!important;margin:0 0 1.5mm!important}
  .pagina-fotos .fotos{display:grid!important;grid-template-columns:1fr 1fr!important;gap:2.2mm!important}.pagina-fotos .fotos figure{width:100%!important;margin:0!important;padding:1mm!important;break-inside:avoid!important;page-break-inside:avoid!important}.pagina-fotos .pic{height:68mm!important}.pagina-fotos .fotos figcaption{font-size:8pt!important;padding:.7mm!important}
  .acoes{display:none!important}
}
`;
  function padronizarLogo(d){
    try{
      const src=new URL('napricelo-icon.svg',location.href).href;
      d.querySelectorAll('.logo').forEach(el=>{
        if(el.dataset.napLogoOk==='1')return;
        el.dataset.napLogoOk='1';
        el.innerHTML=`<img class="nap-logo-img" src="${src}" alt="Napricelo"><span class="nap-logo-txt"><span class="nap-logo-nome">NAPRICELO</span><span class="nap-logo-sub">SOLUÇÕES AMBIENTAIS</span></span>`;
      });
    }catch(_){ }
  }
  function padronizarPagina(d){
    try{
      const p1=d.querySelector('.pagina1')||d.querySelector('.folha');
      if(p1)p1.classList.add('capa-relatorio-instalacao');
      const fotos=d.querySelector('.pagina-fotos');
      if(fotos)fotos.classList.add('pagina-fotos-padronizada');
    }catch(_){ }
  }
  function aplicar(w){
    try{
      if(!w||w.closed||!w.document?.head)return;
      const d=w.document;
      const titulo=(d.title||'').toLowerCase();
      if(!titulo.includes('relatório de instalação')&&!titulo.includes('relatorio de instalação')&&!titulo.includes('relatorio de instalacao'))return;
      d.getElementById(STYLE_ID)?.remove();
      const st=d.createElement('style');st.id=STYLE_ID;st.textContent=CSS;d.head.appendChild(st);
      padronizarLogo(d);padronizarPagina(d);
    }catch(_){ }
  }
  const base=window.open;
  if(typeof base==='function'&&!base.__napRelInstPdfV2){
    const wrapped=function(){
      const w=base.apply(window,arguments);if(!w)return w;
      let n=0;const t=setInterval(()=>{aplicar(w);if(++n>80||w.closed)clearInterval(t)},100);
      try{w.addEventListener('beforeprint',()=>aplicar(w));}catch(_){ }
      return w;
    };
    wrapped.__napRelInstPdfV2=true;window.open=wrapped;
  }
})();
