(()=>{
  const AUTH_KEY='napricelo_auth_session';
  const isMobile=()=>window.matchMedia?.('(max-width: 800px), (pointer: coarse)')?.matches||/Android|iPhone|iPad|iPod/i.test(navigator.userAgent||'');
  function sessao(){try{return JSON.parse(localStorage.getItem(AUTH_KEY)||'null')}catch(_){return null}}
  function hdr(){const s=sessao();return {apikey:SUPABASE_KEY,Authorization:`Bearer ${s?.access_token||''}`}}
  async function osPorAgenda(id){const r=await fetch(`${SUPABASE_URL}/rest/v1/ordens_servico?select=*&agenda_id=eq.${Number(id)}&order=id.desc&limit=1`,{headers:hdr()});if(!r.ok)throw new Error(await r.text());return (await r.json())[0]||null}
  async function manutPorId(id){if(!id)return null;const r=await fetch(`${SUPABASE_URL}/rest/v1/manutencoes?select=*&id=eq.${Number(id)}&limit=1`,{headers:hdr()});if(!r.ok)throw new Error(await r.text());return (await r.json())[0]||null}
  async function localizar(agendaId){const os=await osPorAgenda(agendaId);if(!os)return null;let id=Number(os?.checklist?.pop_manutencao_id||0);if(!id){const m=String(os.observacoes||'').match(/Registro de manuten(?:ç|c)[aã]o:\s*(\d+)/i);if(m)id=Number(m[1]);}let manut=id?await manutPorId(id):null;if(!manut&&os.equipamento_id){const data=String(os.data_fim||os.data_inicio||'').slice(0,10);let url=`${SUPABASE_URL}/rest/v1/manutencoes?select=*&equipamento_id=eq.${Number(os.equipamento_id)}`;if(data)url+=`&data=eq.${encodeURIComponent(data)}`;url+='&order=id.desc&limit=1';const r=await fetch(url,{headers:hdr()});if(r.ok)manut=(await r.json())[0]||null;}return manut}
  function urlTRT(m){const c=m&&typeof m.campos==='object'&&m.campos?m.campos:{};return String(c.trt_pdf_url||'')}
  window.abrirTRTMobile=async function(agendaId){
    let nova=null;
    try{
      if(isMobile()) nova=window.open('about:blank','_blank');
      const manut=await localizar(agendaId),url=urlTRT(manut);
      if(!url){try{nova?.close()}catch(_){};return alert('Nenhuma TRT em PDF está anexada a esta execução.');}
      if(nova&&!nova.closed){nova.location.replace(url);return;}
      if(isMobile()){window.location.assign(url);return;}
      window.open(url,'_blank','noopener');
    }catch(e){console.error(e);try{nova?.close()}catch(_){};alert('Não foi possível abrir a TRT anexada.');}
  };
  function ajustar(){
    if(!isMobile())return;
    document.querySelectorAll('[data-trt-abrir-os]').forEach(b=>{
      const id=Number(b.dataset.trtAbrirOs);if(!id||b.dataset.trtMobile==='1')return;
      b.dataset.trtMobile='1';b.textContent='Abrir TRT';b.onclick=ev=>{ev.preventDefault();ev.stopPropagation();window.abrirTRTMobile(id)};
    });
  }
  new MutationObserver(ajustar).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load',()=>setTimeout(ajustar,700));
  setTimeout(ajustar,900);
})();