(()=>{
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function garantirClientes(){
  try{
    if(typeof window.carregarClientes==='function') await window.carregarClientes();
    else if(typeof window.carregarClientesUnidades==='function') await window.carregarClientesUnidades();
  }catch(e){console.warn('Falha ao recarregar clientes',e)}
  if((!window.clientesCache||!window.clientesCache.length)&&typeof SUPABASE_URL!=='undefined'){
    try{const r=await fetch(`${SUPABASE_URL}/rest/v1/clientes?select=*&order=nome.asc`,{headers:SUPABASE_HEADERS});if(r.ok)window.clientesCache=await r.json()}catch(e){console.warn(e)}
  }
  if((!window.unidadesCache||!window.unidadesCache.length)&&typeof SUPABASE_URL!=='undefined'){
    try{const r=await fetch(`${SUPABASE_URL}/rest/v1/unidades?select=*&order=nome.asc`,{headers:SUPABASE_HEADERS});if(r.ok)window.unidadesCache=await r.json()}catch(e){console.warn(e)}
  }
  if(typeof window.preencherClientesComercial==='function')window.preencherClientesComercial();
}
const editarBase=window.editarOrcamentoComercial;
if(typeof editarBase==='function')window.editarOrcamentoComercial=async function(id){await garantirClientes();await editarBase(id);await sleep(80);const o=(window.comercialOrcamentos||[]).find(x=>Number(x.id)===Number(id)),f=document.getElementById('orcamentoForm');if(!o||!f)return;const cs=f.elements.cliente_id;if(cs){if(![...cs.options].some(x=>Number(x.value)===Number(o.cliente_id))&&o.cliente_id){const op=new Option(o.cliente||`Cliente ${o.cliente_id}`,o.cliente_id);cs.add(op)}cs.value=String(o.cliente_id||'');cs.dispatchEvent(new Event('change',{bubbles:true}))}await sleep(50);const us=f.elements.unidade_id;if(us){if(![...us.options].some(x=>Number(x.value)===Number(o.unidade_id))&&o.unidade_id){us.add(new Option(o.unidade||`Unidade ${o.unidade_id}`,o.unidade_id))}us.value=String(o.unidade_id||'')}};
function prepararClonePDF(source){const clone=source.cloneNode(true);clone.querySelectorAll('button,.no-print').forEach(x=>x.remove());clone.querySelectorAll('input,textarea,select').forEach(el=>{const s=document.createElement(el.tagName==='TEXTAREA'?'div':'span');s.textContent=el.tagName==='SELECT'?(el.selectedOptions[0]?.textContent||''):el.value;s.style.cssText='display:block;white-space:pre-wrap;color:#111;background:#fff;padding:3px 0';el.replaceWith(s)});clone.querySelectorAll('*').forEach(el=>{const cs=getComputedStyle(el);if(cs.display==='none')el.style.display='';el.style.visibility='visible';el.style.opacity='1'});return clone}
async function gerarPDFVisivel(source,nome){if(!window.html2pdf)throw new Error('Gerador de PDF não carregado');const host=document.createElement('div');host.style.cssText='position:fixed;left:0;top:0;width:210mm;min-height:297mm;padding:10mm;background:#fff;color:#111;z-index:-1;opacity:1;pointer-events:none';host.appendChild(prepararClonePDF(source));document.body.appendChild(host);await sleep(180);const blob=await html2pdf().set({margin:[8,8,8,8],filename:nome,image:{type:'jpeg',quality:.96},html2canvas:{scale:1.6,useCORS:true,backgroundColor:'#ffffff',scrollX:0,scrollY:0},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},pagebreak:{mode:['css','legacy']}}).from(host).toPdf().outputPdf('blob');host.remove();return blob}
window.NapriceloPDFv63={gerarPDFVisivel,prepararClonePDF};
const old=window.NapriceloShareMain;
if(old&&typeof old.shareNow==='function'){
 const share=async function(x,btn){try{const source=document.getElementById('detailContent');if(!source)throw new Error('Abra os detalhes antes de gerar o PDF.');if(btn){btn.disabled=true;btn.textContent='Gerando PDF...'}const nome=`Napricelo-${String(x?.codigo||'Relatorio').replace(/[^a-z0-9_-]/gi,'-')}.pdf`;const blob=await gerarPDFVisivel(source,nome);const file=new File([blob],nome,{type:'application/pdf'});if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]})))await navigator.share({title:'Relatório Napricelo',files:[file]});else{const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=nome;a.click();setTimeout(()=>URL.revokeObjectURL(u),30000)}}catch(e){if(e?.name!=='AbortError'){console.error(e);alert('Não foi possível gerar/compartilhar o PDF.')}}finally{if(btn){btn.disabled=false;btn.textContent='Compartilhar PDF'}}};
 old.shareNow=share;
}
})();