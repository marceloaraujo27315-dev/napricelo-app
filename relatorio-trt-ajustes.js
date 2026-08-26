(function(){
  const BUCKET='manutencoes-fotos';
  let trtBlobAtual=null;

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

  function pathDaTRT(url){
    const s=String(url||'');
    const marca=`/storage/v1/object/public/${BUCKET}/`;
    const i=s.indexOf(marca);
    return i>=0?decodeURIComponent(s.slice(i+marca.length)):'';
  }
  async function blobURLTRT(url){
    const path=pathDaTRT(url);if(!path)throw new Error('Caminho do PDF da TRT não identificado.');
    const r=await fetch(`${SUPABASE_URL}/storage/v1/object/authenticated/${BUCKET}/${encodeURI(path)}`,{headers:headers()});
    if(!r.ok)throw new Error(await r.text());
    const blob=await r.blob();
    if(trtBlobAtual)URL.revokeObjectURL(trtBlobAtual);
    trtBlobAtual=URL.createObjectURL(blob);
    return trtBlobAtual;
  }

  window.anexarTRTPDFOS=async function(agendaId){
    try{
      const {manut}=await localizarManut(agendaId);if(!manut)return alert('Não foi possível localizar a execução vinculada a esta OS.');
      const inp=document.createElement('input');inp.type='file';inp.accept='application/pdf,.pdf';inp.style.display='none';document.body.appendChild(inp);
      inp.onchange=async()=>{try{const f=inp.files?.[0];if(!f)return;const btns=[...document.querySelectorAll(`[data-trt-os="${Number(agendaId)}"]`)];btns.forEach(b=>{b.disabled=true;b.textContent='Enviando TRT...'});const url=await enviarTRT(f,manut);const c=camposObj(manut);c.trt_pdf_url=url;c.trt_pdf_nome=f.name||'TRT.pdf';c.trt_pdf_anexado_em=new Date().toISOString();await salvarCampos(manut,c);alert('TRT anexada com sucesso ao registro desta execução.');await atualizarAcoesTRT(agendaId);await mostrarTRTInline(agendaId,true);btns.forEach(b=>{b.disabled=false;});}catch(e){console.error(e);alert('Não foi possível anexar a TRT. '+(e.message||''));}finally{inp.remove();}};
      inp.click();
    }catch(e){console.error(e);alert('Não foi possível preparar o anexo da TRT.');}
  };

  async function mostrarTRTInline(agendaId,forcar=false){
    try{
      const {manut}=await localizarManut(agendaId);const c=camposObj(manut);if(!c.trt_pdf_url)return;
      let box=document.querySelector(`[data-trt-preview="${Number(agendaId)}"]`);
      if(!box){
        const acoes=document.querySelector('.os-resgate-acoes')||document.querySelector(`[data-trt-os="${Number(agendaId)}"]`)?.parentElement;
        if(!acoes)return;
        box=document.createElement('div');box.className='trt-preview';box.dataset.trtPreview=String(agendaId);
        box.innerHTML=`<div class="trt-preview-head"><b>TRT anexada</b><span>${String(c.trt_pdf_nome||'Documento TRT')}</span></div><div class="trt-preview-status">Carregando documento...</div>`;
        acoes.insertAdjacentElement('afterend',box);
      }else if(!forcar&&box.querySelector('iframe'))return;
      const blobUrl=await blobURLTRT(c.trt_pdf_url);
      box.innerHTML=`<div class="trt-preview-head"><b>TRT anexada</b><span>${String(c.trt_pdf_nome||'Documento TRT')}</span></div><iframe title="TRT anexada" src="${blobUrl}#toolbar=1&navpanes=0&view=FitH"></iframe>`;
    }catch(e){console.error(e);const box=document.querySelector(`[data-trt-preview="${Number(agendaId)}"]`);if(box)box.innerHTML='<div class="trt-preview-head"><b>TRT anexada</b></div><div class="trt-preview-status">Não foi possível carregar a visualização do PDF. Use o botão “Visualizar TRT”.</div>';}
  }

  window.abrirTRTPDFOS=async function(agendaId){try{const {manut}=await localizarManut(agendaId);const url=camposObj(manut).trt_pdf_url;if(!url)return alert('Nenhuma TRT em PDF está anexada a esta execução.');const blobUrl=await blobURLTRT(url);window.open(blobUrl,'_blank');}catch(e){console.error(e);alert('Não foi possível abrir a TRT anexada.');}}

  async function atualizarAcoesTRT(agendaId){
    try{
      const {manut}=await localizarManut(agendaId);const c=camposObj(manut),tem=!!c.trt_pdf_url;
      document.querySelectorAll(`[data-trt-os="${Number(agendaId)}"]`).forEach(b=>{b.textContent=tem?'Substituir TRT / PDF':'Anexar TRT / PDF';b.disabled=false;});
      document.querySelectorAll(`[data-trt-abrir-os="${Number(agendaId)}"]`).forEach(b=>b.style.display=tem?'':'none');
    }catch(_){ }
  }
  function adicionarBotoesNoModal(agendaId){const box=document.querySelector('.os-resgate-acoes');if(!box||box.querySelector(`[data-trt-os="${Number(agendaId)}"]`))return;const an=document.createElement('button');an.type='button';an.className='action';an.dataset.trtOs=String(agendaId);an.textContent='Anexar TRT / PDF';an.onclick=()=>anexarTRTPDFOS(agendaId);const ab=document.createElement('button');ab.type='button';ab.className='action';ab.dataset.trtAbrirOs=String(agendaId);ab.textContent='Visualizar TRT';ab.dataset.trtAbrirOs=String(agendaId);ab.style.display='none';ab.onclick=()=>mostrarTRTInline(agendaId,true);box.append(an,ab);atualizarAcoesTRT(agendaId).then(()=>mostrarTRTInline(agendaId));}
  const visualBase=window.visualizarExecucaoOS;if(typeof visualBase==='function')window.visualizarExecucaoOS=async function(agendaId){const r=await visualBase.apply(this,arguments);setTimeout(()=>adicionarBotoesNoModal(Number(agendaId)),80);return r};
  function varrerOS(){document.querySelectorAll('[data-relatorio-tecnico-os]').forEach(rel=>{const id=Number(rel.dataset.relatorioTecnicoOs);const pai=rel.parentElement;if(!id||!pai||pai.querySelector(`[data-trt-os="${id}"]`))return;const b=document.createElement('button');b.type='button';b.className='action';b.dataset.trtOs=String(id);b.textContent='Anexar TRT / PDF';b.onclick=()=>anexarTRTPDFOS(id);pai.insertBefore(b,rel.nextSibling);const v=document.createElement('button');v.type='button';v.className='action';v.dataset.trtAbrirOs=String(id);v.textContent='Visualizar TRT';v.style.display='none';v.onclick=()=>mostrarTRTInline(id,true);pai.insertBefore(v,b.nextSibling);atualizarAcoesTRT(id);});}
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
          const manut=await manutPorId(id),c=camposObj(manut);if(c.trt_pdf_url){const trtbox=janela.document.querySelector('.trtbox');const alvo=trtbox?.children?.[1];if(alvo&&!alvo.querySelector('.trt-anexo-rel')){const d=janela.document.createElement('div');d.className='trt-anexo-rel';d.style.marginTop='5px';d.style.fontSize='8px';d.innerHTML='<b>Documento da TRT:</b> PDF anexado ao registro eletrônico da execução';alvo.appendChild(d);}}
        }catch(e){console.warn('Ajuste final do relatório não aplicado.',e)}
      },120);
    }
  };

  function inserirCoordenadas(input,lat,lon,acc){
    const base=String(input.value||'').replace(/\s*\|?\s*Coordenadas:\s*-?\d+[.,]\d+\s*,\s*-?\d+[.,]\d+(?:\s*\(precisão[^)]*\))?/i,'').trim();
    const coord=`Coordenadas: ${lat.toFixed(6)}, ${lon.toFixed(6)}${Number.isFinite(acc)?` (precisão ±${Math.round(acc)} m)`:''}`;
    input.value=base?`${base} | ${coord}`:coord;
    input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));
  }
  function capturarLocalizacao(input,btn,status){
    if(!navigator.geolocation){status.textContent='Geolocalização não disponível neste navegador.';return;}
    btn.disabled=true;btn.textContent='Obtendo localização...';status.textContent='Autorize o acesso à localização, se o navegador solicitar.';
    navigator.geolocation.getCurrentPosition(p=>{const c=p.coords;inserirCoordenadas(input,c.latitude,c.longitude,c.accuracy);status.textContent=`Localização capturada: ${c.latitude.toFixed(6)}, ${c.longitude.toFixed(6)}.`;btn.disabled=false;btn.textContent='Usar localização atual';},e=>{const msg=e.code===1?'Permissão de localização negada.':e.code===2?'Localização indisponível no momento.':'Tempo esgotado ao obter localização.';status.textContent=msg;btn.disabled=false;btn.textContent='Usar localização atual';},{enableHighAccuracy:true,timeout:15000,maximumAge:30000});
  }
  function prepararLocalizadores(){
    const seletores=['#equipForm [name="local"]','#instalacaoForm [name="local_instalacao"]','#agendaInstalacaoForm [name="local_instalacao"]','input[name="localizacao"]','input[name="local"]'];
    document.querySelectorAll(seletores.join(',')).forEach(input=>{
      if(input.dataset.geoPreparado==='1')return;input.dataset.geoPreparado='1';
      const wrap=document.createElement('div');wrap.className='geo-campo';
      const btn=document.createElement('button');btn.type='button';btn.className='geo-btn';btn.textContent='Usar localização atual';
      const st=document.createElement('small');st.className='geo-status';st.textContent='Preenche latitude e longitude usando o GPS/localização do aparelho.';
      btn.addEventListener('click',()=>capturarLocalizacao(input,btn,st));wrap.append(btn,st);
      const label=input.closest('label');if(label)label.insertAdjacentElement('afterend',wrap);else input.insertAdjacentElement('afterend',wrap);
    });
  }

  const css=document.createElement('style');css.textContent='.trt-preview{margin-top:12px;border:1px solid #cfe0d7;border-radius:10px;background:#fff;overflow:hidden}.trt-preview-head{padding:10px 12px;background:#f1f7f4;display:flex;justify-content:space-between;gap:10px;align-items:center;color:#176b45}.trt-preview-head span{font-size:11px;color:#52645b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.trt-preview iframe{display:block;width:100%;height:min(72vh,760px);border:0;background:#eef3f0}.trt-preview-status{padding:14px;color:#52645b;font-size:12px}.geo-campo{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:-3px 0 10px}.geo-btn{border:1px solid #176b45;background:#f1f7f4;color:#176b45;border-radius:7px;padding:8px 11px;font-weight:700;cursor:pointer}.geo-btn:disabled{opacity:.65;cursor:wait}.geo-status{color:#64736c;font-size:11px;line-height:1.3}@media(max-width:700px){.trt-preview iframe{height:68vh}.geo-campo{align-items:stretch}.geo-btn{width:100%}}';document.head.appendChild(css);
  prepararLocalizadores();new MutationObserver(prepararLocalizadores).observe(document.body,{childList:true,subtree:true});setTimeout(prepararLocalizadores,500);
})();