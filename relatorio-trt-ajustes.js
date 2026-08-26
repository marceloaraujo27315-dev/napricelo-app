(function(){
  const BUCKET='manutencoes-fotos';
  function sessao(){try{return JSON.parse(localStorage.getItem('napricelo_auth_session')||'null')}catch(_){return null}}
  function headers(extra={}){const s=sessao();const jwt=s?.access_token;if(!jwt)throw new Error('Faça login novamente para anexar a TRT.');return {apikey:SUPABASE_KEY,Authorization:`Bearer ${jwt}`,...extra}}
  async function osPorAgenda(agendaId){const r=await fetch(`${SUPABASE_URL}/rest/v1/ordens_servico?select=*&agenda_id=eq.${Number(agendaId)}&order=id.desc&limit=1`,{headers:SUPABASE_HEADERS});if(!r.ok)throw new Error(await r.text());return (await r.json())[0]||null}
  async function manutPorId(id){if(!id)return null;const r=await fetch(`${SUPABASE_URL}/rest/v1/manutencoes?select=*&id=eq.${Number(id)}&limit=1`,{headers:SUPABASE_HEADERS});if(!r.ok)throw new Error(await r.text());return (await r.json())[0]||null}
  async function localizarManut(agendaId){
    const os=await osPorAgenda(agendaId);if(!os)return {os:null,manut:null};
    let id=Number(os?.checklist?.pop_manutencao_id||0);
    if(!id){const m=String(os.observacoes||'').match(/Registro de manuten(?:ç|c)[aã]o:\s*(\d+)/i);if(m)id=Number(m[1]);}
    let manut=id?await manutPorId(id):null;
    if(!manut&&os.equipamento_id){const data=String(os.data_fim||os.data_inicio||'').slice(0,10);let url=`${SUPABASE_URL}/rest/v1/manutencoes?select=*&equipamento_id=eq.${Number(os.equipamento_id)}`;if(data)url+=`&data=eq.${encodeURIComponent(data)}`;url+='&order=id.desc&limit=1';const r=await fetch(url,{headers:SUPABASE_HEADERS});if(r.ok)manut=(await r.json())[0]||null;}
    return {os,manut};
  }
  function camposObj(x){return x&&typeof x.campos==='object'&&x.campos?{...x.campos}:{}}
  async function salvarCampos(manut,campos){const r=await fetch(`${SUPABASE_URL}/rest/v1/manutencoes?id=eq.${Number(manut.id)}`,{method:'PATCH',headers:{...SUPABASE_HEADERS,Prefer:'return=representation'},body:JSON.stringify({campos})});if(!r.ok)throw new Error(await r.text());const novo=(await r.json())[0];try{if(typeof cloudHistorico!=='undefined'&&Array.isArray(cloudHistorico.manut)){const i=cloudHistorico.manut.findIndex(x=>Number(x.id)===Number(manut.id));if(i>=0)cloudHistorico.manut[i]=novo;}}catch(_){}return novo}
  async function enviarTRT(file,manut){
    if(!file||file.type!=='application/pdf')throw new Error('Selecione um arquivo PDF da TRT.');
    if(file.size>15*1024*1024)throw new Error('O PDF da TRT deve ter no máximo 15 MB.');
    const safe=String(manut.codigo||`manut-${manut.id}`).replace(/[^a-zA-Z0-9_-]/g,'-');
    const path=`${safe}/trt/${Date.now()}-${crypto.randomUUID()}.pdf`;
    const r=await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`,{method:'POST',headers:headers({'Content-Type':'application/pdf','x-upsert':'false'}),body:file});
    if(!r.ok)throw new Error(await r.text());
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
  }
  window.anexarTRTPDFOS=async function(agendaId){
    try{
      const {manut}=await localizarManut(agendaId);if(!manut)return alert('Não foi possível localizar a execução vinculada a esta OS.');
      const inp=document.createElement('input');inp.type='file';inp.accept='application/pdf,.pdf';inp.style.display='none';document.body.appendChild(inp);
      inp.onchange=async()=>{try{const f=inp.files?.[0];if(!f)return;const btns=[...document.querySelectorAll(`[data-trt-os="${Number(agendaId)}"]`)];btns.forEach(b=>{b.disabled=true;b.textContent='Enviando TRT...'});const url=await enviarTRT(f,manut);const c=camposObj(manut);c.trt_pdf_url=url;c.trt_pdf_nome=f.name||'TRT.pdf';c.trt_pdf_anexado_em=new Date().toISOString();await salvarCampos(manut,c);alert('TRT anexada com sucesso ao registro desta execução.');await atualizarAcoesTRT(agendaId);btns.forEach(b=>{b.disabled=false;});}catch(e){console.error(e);alert('Não foi possível anexar a TRT. '+(e.message||''));}finally{inp.remove();}};
      inp.click();
    }catch(e){console.error(e);alert('Não foi possível preparar o anexo da TRT.');}
  };
  window.abrirTRTPDFOS=async function(agendaId){try{const {manut}=await localizarManut(agendaId);const url=camposObj(manut).trt_pdf_url;if(!url)return alert('Nenhuma TRT em PDF está anexada a esta execução.');window.open(url,'_blank');}catch(e){console.error(e);alert('Não foi possível abrir a TRT anexada.');}}
  async function atualizarAcoesTRT(agendaId){
    try{
      const {manut}=await localizarManut(agendaId);const c=camposObj(manut),tem=!!c.trt_pdf_url;
      document.querySelectorAll(`[data-trt-os="${Number(agendaId)}"]`).forEach(b=>{b.textContent=tem?'Substituir TRT / PDF':'Anexar TRT / PDF';b.disabled=false;});
      document.querySelectorAll(`[data-trt-abrir-os="${Number(agendaId)}"]`).forEach(b=>b.style.display=tem?'':'none');
    }catch(_){ }
  }
  function adicionarBotoesNoModal(agendaId){const box=document.querySelector('.os-resgate-acoes');if(!box||box.querySelector(`[data-trt-os="${Number(agendaId)}"]`))return;const an=document.createElement('button');an.type='button';an.className='action';an.dataset.trtOs=String(agendaId);an.textContent='Anexar TRT / PDF';an.onclick=()=>anexarTRTPDFOS(agendaId);const ab=document.createElement('button');ab.type='button';ab.className='action';ab.dataset.trtAbrirOs=String(agendaId);ab.textContent='Abrir TRT anexada';ab.style.display='none';ab.onclick=()=>abrirTRTPDFOS(agendaId);box.append(an,ab);atualizarAcoesTRT(agendaId);}
  const visualBase=window.visualizarExecucaoOS;if(typeof visualBase==='function')window.visualizarExecucaoOS=async function(agendaId){const r=await visualBase.apply(this,arguments);setTimeout(()=>adicionarBotoesNoModal(Number(agendaId)),80);return r};
  function varrerOS(){document.querySelectorAll('[data-relatorio-tecnico-os]').forEach(rel=>{const id=Number(rel.dataset.relatorioTecnicoOs);const pai=rel.parentElement;if(!id||!pai||pai.querySelector(`[data-trt-os="${id}"]`))return;const b=document.createElement('button');b.type='button';b.className='action';b.dataset.trtOs=String(id);b.textContent='Anexar TRT / PDF';b.onclick=()=>anexarTRTPDFOS(id);pai.insertBefore(b,rel.nextSibling);atualizarAcoesTRT(id);});}
  new MutationObserver(varrerOS).observe(document.body,{childList:true,subtree:true});setInterval(varrerOS,1500);setTimeout(varrerOS,500);

  const relBase=window.gerarRelatorioTecnicoExecucao;
  if(typeof relBase==='function')window.gerarRelatorioTecnicoExecucao=function(id){
    const abrirOriginal=window.open;let janela=null;
    window.open=function(){janela=abrirOriginal.apply(window,arguments);return janela};
    try{return relBase.apply(this,arguments);}finally{
      window.open=abrirOriginal;
      if(janela)setTimeout(async()=>{
        try{
          const st=janela.document.createElement('style');
          st.textContent=`@media print{.main{font-size:10px!important;min-height:0!important}.main header{padding-bottom:6px!important}.main .title{margin:8px 0 7px!important;padding:7px 10px!important}.main .title h1{font-size:18px!important}.main .section{margin-top:7px!important}.main h2{font-size:12px!important;margin-bottom:3px!important}.main .secnum{width:19px!important;height:19px!important;font-size:9px!important}.main .r{padding:3px 2px!important}.main .r b,.main .r span{font-size:8.7px!important}.main .texto{padding:5px 7px!important;line-height:1.25!important;min-height:0!important;font-size:9.2px!important}.main .trtbox{padding:6px 8px!important;font-size:8.8px!important}.main .ass{margin-top:27px!important;gap:36px!important}.main .asscrop{height:14mm!important;bottom:9mm!important}.main .legal{margin-top:7px!important;padding:4px 6px!important;font-size:6.8px!important;line-height:1.2!important}.main footer{font-size:6.5px!important}.main{page-break-after:always!important}.photos{page-break-before:auto!important;min-height:0!important}.photos figure{margin:5px 0!important}.photos .pic{height:65mm!important}}`;
          janela.document.head.appendChild(st);
          const manut=await manutPorId(id),c=camposObj(manut);if(c.trt_pdf_url){const trtbox=janela.document.querySelector('.trtbox');const alvo=trtbox?.children?.[1];if(alvo&&!alvo.querySelector('.trt-anexo-rel')){const d=janela.document.createElement('div');d.className='trt-anexo-rel';d.style.marginTop='5px';d.style.fontSize='8px';d.innerHTML=`<b>Documento da TRT:</b> <a href="${String(c.trt_pdf_url).replace(/"/g,'&quot;')}" target="_blank">PDF anexado ao registro eletrônico</a>`;alvo.appendChild(d);}}
        }catch(e){console.warn('Ajuste final do relatório não aplicado.',e)}
      },120);
    }
  };
})();