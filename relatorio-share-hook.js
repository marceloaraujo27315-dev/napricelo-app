(()=>{
  const LIB='https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
  let carregando=null;
  function carregarLib(){
    if(window.html2pdf)return Promise.resolve(window.html2pdf);
    if(carregando)return carregando;
    carregando=new Promise((resolve,reject)=>{
      const s=document.createElement('script');s.src=LIB;s.async=true;
      s.onload=()=>window.html2pdf?resolve(window.html2pdf):reject(new Error('Biblioteca PDF não carregou.'));
      s.onerror=()=>reject(new Error('Não foi possível carregar o gerador de PDF. Conecte à internet uma vez e tente novamente.'));
      document.head.appendChild(s);
    });
    return carregando;
  }
  function nomeArquivo(w){
    const t=(w.document.title||'Relatorio Napricelo').replace(/^Relatório\s*/i,'').trim();
    return `Napricelo-${t||'Relatorio'}`.replace(/[^a-zA-Z0-9À-ÿ_-]+/g,'-').replace(/-+/g,'-')+'.pdf';
  }
  async function esperarImagens(doc){
    const imgs=[...doc.images];
    await Promise.all(imgs.map(img=>img.complete?Promise.resolve():new Promise(r=>{img.onload=img.onerror=r;setTimeout(r,5000)})));
  }
  async function gerarBlob(w){
    const html2pdf=await carregarLib();
    await esperarImagens(w.document);
    const folhas=[...w.document.querySelectorAll('.folha')];
    if(!folhas.length)throw new Error('Relatório não encontrado para gerar PDF.');
    const holder=w.document.createElement('div');
    folhas.forEach((f,i)=>{const c=f.cloneNode(true);c.style.margin='0';c.style.boxShadow='none';c.style.width='210mm';c.style.minHeight='277mm';c.style.pageBreakAfter=i<folhas.length-1?'always':'auto';holder.appendChild(c)});
    holder.style.background='#fff';holder.style.width='210mm';
    const opt={margin:[10,10,10,10],filename:nomeArquivo(w),image:{type:'jpeg',quality:.94},html2canvas:{scale:1.55,useCORS:true,allowTaint:false,backgroundColor:'#ffffff',logging:false},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},pagebreak:{mode:['css','legacy']}};
    return html2pdf().set(opt).from(holder).toPdf().outputPdf('blob');
  }
  function preparar(w,btn){
    if(w.__napPdfBlobPromise)return w.__napPdfBlobPromise;
    if(btn){btn.disabled=true;btn.textContent='Preparando PDF...'}
    w.__napPdfBlobPromise=gerarBlob(w).then(blob=>{w.__napPdfBlob=blob;if(btn){btn.disabled=false;btn.textContent='Compartilhar PDF'}return blob}).catch(err=>{w.__napPdfBlobPromise=null;if(btn){btn.disabled=false;btn.textContent='Tentar compartilhar PDF'}throw err});
    return w.__napPdfBlobPromise;
  }
  async function compartilhar(w,btn){
    try{
      const blob=w.__napPdfBlob||await preparar(w,btn);
      const file=new File([blob],nomeArquivo(w),{type:'application/pdf'});
      if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){
        await navigator.share({title:'Relatório Napricelo',files:[file]});
      }else{
        const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
        alert('O PDF foi salvo no aparelho. Abra o arquivo e toque em Compartilhar para enviar pelo WhatsApp.');
      }
    }catch(e){
      if(e?.name!=='AbortError'){console.error('Compartilhamento PDF',e);alert((e?.name==='NotAllowedError'?'O Android bloqueou o compartilhamento direto. Toque novamente em Compartilhar PDF.':e?.message)||'Não foi possível gerar/compartilhar o PDF.');}
    }
  }
  function instalarNoRelatorio(w){
    try{
      const doc=w.document,acoes=doc.querySelector('.acoes');if(!acoes||doc.getElementById('napSharePdf'))return;
      const b=doc.createElement('button');b.id='napSharePdf';b.type='button';b.textContent='Preparando PDF...';b.style.marginLeft='8px';
      b.onclick=()=>compartilhar(w,b);acoes.appendChild(b);
      const info=doc.createElement('small');info.textContent='No celular, use Compartilhar PDF para enviar o arquivo como documento pelo WhatsApp, e-mail ou Drive.';info.style.cssText='display:block;margin-top:8px;color:#5d6e65;font-size:12px';acoes.appendChild(info);
      setTimeout(()=>preparar(w,b).catch(e=>console.warn('Pré-geração do PDF falhou',e)),120);
    }catch(e){console.warn('Não foi possível instalar compartilhamento PDF',e)}
  }
  window.NapriceloSharePDF={share:compartilhar,install:instalarNoRelatorio,prepare:preparar};
  const openBase=window.open;
  window.open=function(...args){
    const w=openBase.apply(this,args);if(!w)return w;
    try{
      const closeBase=w.document.close.bind(w.document);
      w.document.close=function(){const r=closeBase();setTimeout(()=>instalarNoRelatorio(w),80);return r};
      setTimeout(()=>instalarNoRelatorio(w),500);
    }catch{}
    return w;
  };
  carregarLib().catch(()=>{});
})();