(()=>{
  const PREFIX='napricelo_multi_urls:';
  const uniq=a=>[...new Set((a||[]).filter(Boolean))];
  const arr=v=>Array.isArray(v)?v.filter(Boolean):(typeof v==='string'&&v?[v]:[]);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function formInst(){return document.getElementById('instalacaoForm')}
  function contextoEtapa(etapa){
    const f=formInst();if(!f)return null;
    const ag=f.querySelector('[name="agendamento_id"]')?.value||'novo';
    const cl=f.querySelector('[name="cliente_id"]')?.value||'cliente';
    return `${PREFIX}inst:${ag}:${cl}:${etapa}`;
  }
  function urlsLocais(etapa){
    try{const k=contextoEtapa(etapa);return k?arr(JSON.parse(localStorage.getItem(k)||'[]')):[]}catch(_){return[]}
  }
  function limparLocais(){for(const e of ['antes','durante','depois']){const k=contextoEtapa(e);if(k)try{localStorage.removeItem(k)}catch(_){}}}

  // Garante que as fotos adicionais já enviadas pelo botão "+ Adicionar outra foto"
  // sejam vinculadas ao registro da instalação no momento do POST/PATCH.
  if(!window.__napInstMultiFinalFetch){
    window.__napInstMultiFinalFetch=true;
    const base=window.fetch.bind(window);
    window.fetch=async function(input,init={}){
      const url=typeof input==='string'?input:input?.url||'';
      const method=String(init?.method||(typeof input!=='string'&&input?.method)||'GET').toUpperCase();
      if(/\/rest\/v1\/instalacoes(?:\?|$)/.test(url)&&['POST','PATCH'].includes(method)&&init?.body){
        try{
          const b=JSON.parse(init.body);
          if(!Array.isArray(b)){
            b.fotos_antes=uniq([...arr(b.fotos_antes),...arr(b.foto_antes),...urlsLocais('antes')]);
            b.fotos_durante=uniq([...arr(b.fotos_durante),...arr(b.foto_durante),...urlsLocais('durante')]);
            b.fotos_depois=uniq([...arr(b.fotos_depois),...arr(b.foto_depois),...urlsLocais('depois')]);
            init={...init,body:JSON.stringify(b)};
          }
        }catch(e){console.warn('Não foi possível complementar as fotos da instalação.',e)}
      }
      const r=await base(input,init);
      if(/\/rest\/v1\/instalacoes(?:\?|$)/.test(url)&&method==='POST'&&r.ok)setTimeout(limparLocais,500);
      return r;
    };
  }

  function grupos(x){
    return [
      ['Antes',uniq([...arr(x?.fotos_antes),...arr(x?.foto_antes)])],
      ['Durante',uniq([...arr(x?.fotos_durante),...arr(x?.foto_durante)])],
      ['Depois',uniq([...arr(x?.fotos_depois),...arr(x?.foto_depois)])]
    ].filter(([,a])=>a.length);
  }
  function todas(x){return grupos(x).flatMap(([nome,a])=>a.map((u,i)=>[`${nome}${a.length>1?` ${i+1}`:''}`,u]))}

  // Histórico: mostra todas as evidências, não apenas a primeira de cada etapa.
  window.fotosInstalacaoHtml=function(x){
    const fotos=todas(x);
    if(!fotos.length)return '<p class="muted">Nenhuma foto registrada nesta instalação.</p>';
    return `<div class="photo-grid">${fotos.map(([n,u])=>`<figure><img src="${esc(u)}" alt="Foto ${esc(n)}"><figcaption>${esc(n)}</figcaption></figure>`).join('')}</div>`;
  };

  function registroPorId(id){
    return window.historicoInstalacoesCache?.find?.(r=>Number(r.id)===Number(id))||null;
  }
  async function buscarRegistro(id){
    const local=registroPorId(id);if(local)return local;
    try{
      const r=await fetch(`${SUPABASE_URL}/rest/v1/instalacoes?select=*&id=eq.${Number(id)}&limit=1`,{headers:SUPABASE_HEADERS});
      if(r.ok)return (await r.json())[0]||null;
    }catch(_){ }
    return null;
  }
  function aplicarFotosRelatorio(win,x){
    if(!win||win.closed||!x)return;
    const fotos=todas(x);if(!fotos.length)return;
    const d=win.document;
    let sec=d.querySelector('.pagina-fotos');
    if(!sec){
      const primeira=d.querySelector('.pagina1,.folha');if(!primeira)return;
      sec=d.createElement('section');sec.className='folha pagina-fotos';
      const cab=primeira.querySelector('.top')?.cloneNode(true);
      if(cab)sec.appendChild(cab);
      const h=d.createElement('h2');h.className='sec titulo-fotos';h.textContent='Registro fotográfico da instalação';sec.appendChild(h);
      const p=d.createElement('p');p.className='intro';p.textContent='Evidências fotográficas vinculadas ao registro de instalação.';sec.appendChild(p);
      const grid=d.createElement('div');grid.className='fotos';sec.appendChild(grid);
      const rod=primeira.querySelector('.rod')?.cloneNode(true);if(rod)sec.appendChild(rod);
      const acoes=d.querySelector('.acoes');(acoes?.parentNode||d.body).insertBefore(sec,acoes||null);
    }
    let grid=sec.querySelector('.fotos');if(!grid){grid=d.createElement('div');grid.className='fotos';sec.appendChild(grid)}
    grid.innerHTML=fotos.map(([n,u])=>`<figure><div class="pic"><img src="${esc(u)}" alt="${esc(n)}"></div><figcaption>${esc(n)}</figcaption></figure>`).join('');
    const st=d.createElement('style');
    st.textContent=`.pagina-fotos .fotos{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.pagina-fotos .fotos figure{width:100%!important;margin:0!important}.pagina-fotos .pic{height:250px!important}@media print{.pagina-fotos .fotos{grid-template-columns:repeat(2,1fr)!important;gap:3mm!important}.pagina-fotos .fotos figure{width:100%!important;break-inside:avoid;page-break-inside:avoid}.pagina-fotos .pic{height:58mm!important}.pagina-fotos .fotos figcaption{font-size:8.5pt!important}.pagina-fotos{min-height:auto!important}}@media(max-width:700px){.pagina-fotos .fotos{grid-template-columns:1fr!important}}`;
    d.head.appendChild(st);
  }

  function envolverRelatorio(){
    const base=window.gerarRelatorioInstalacao;
    if(typeof base!=='function'||base.__multiFotosFinal)return false;
    const f=async function(id){
      const x=await buscarRegistro(id);
      let capt=null;const old=window.open;
      window.open=function(){capt=old.apply(window,arguments);return capt};
      try{return await base.apply(this,arguments)}finally{
        window.open=old;
        if(capt){
          let n=0;const t=setInterval(()=>{try{aplicarFotosRelatorio(capt,x)}catch(_){}if(++n>20||capt.closed)clearInterval(t)},120);
        }
      }
    };
    f.__multiFotosFinal=true;window.gerarRelatorioInstalacao=f;return true;
  }
  let tent=0;const timer=setInterval(()=>{if(envolverRelatorio()||++tent>30)clearInterval(timer)},250);
  setTimeout(envolverRelatorio,50);
})();