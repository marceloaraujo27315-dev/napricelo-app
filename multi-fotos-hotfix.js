(()=>{
  const BUCKET='manutencoes-fotos';
  const prevFetch=window.fetch.bind(window);
  const extraFiles=new WeakMap();

  function sessao(){try{return JSON.parse(localStorage.getItem('napricelo_auth_session')||'null')}catch(_){return null}}
  function headers(extra={}){const jwt=sessao()?.access_token;if(!jwt)throw new Error('Faça login novamente para salvar as fotos.');return {apikey:SUPABASE_KEY,Authorization:`Bearer ${jwt}`,...extra}}
  function ext(file){const n=(file?.name||'').split('.').pop()?.toLowerCase();if(['jpg','jpeg','png','webp'].includes(n))return n==='jpeg'?'jpg':n;if(file?.type==='image/png')return'png';if(file?.type==='image/webp')return'webp';return'jpg'}
  function uniq(a){return [...new Set((a||[]).filter(Boolean))]}
  function urls(v){if(Array.isArray(v))return v.filter(Boolean);if(typeof v==='string'&&v)return[v];return[]}
  function etapa(inp,i){return inp.dataset.etapa||['antes','durante','depois'][i]||'evidencia'}
  function fingerprint(f){return `${f?.name||''}:${f?.size||0}:${f?.lastModified||0}`}
  function contexto(inp){
    const f=inp.form,e=inp.dataset.etapa||'foto';
    if(!f)return `geral:${e}`;
    if(f.classList.contains('manutForm')){const sel=f.querySelector('.equipSelect'),idx=Number(sel?.value),eq=(typeof eqs==='function'&&Number.isFinite(idx))?eqs()[idx]:null;return `manut:${eq?.id||eq?.codigo||f.dataset.tipo||'novo'}:${e}`}
    if(f.id==='instalacaoForm')return `inst:${f.querySelector('[name=agendamento_id]')?.value||'novo'}:${f.querySelector('[name=cliente_id]')?.value||'cliente'}:${e}`;
    if(f.id==='equipForm')return `equip:${f.querySelector('[name=codigo]')?.value||'novo'}:${e}`;
    if(f.id==='orcamentoForm')return `orc:${f.querySelector('[name=cliente_id]')?.value||'cliente'}:${e}`;
    if(f.id==='analiseForm')return `ana:${f.querySelector('[name=equipamento_id]')?.value||'equip'}:${e}`;
    return `${f.id||'form'}:${e}`;
  }
  function storageKey(inp){return `napricelo_multi_urls:${contexto(inp)}`}
  function stored(inp){try{return JSON.parse(localStorage.getItem(storageKey(inp))||'[]')}catch(_){return[]}}
  function saveStored(inp,a){try{localStorage.setItem(storageKey(inp),JSON.stringify(uniq(a)))}catch(_){}}
  function pasta(inp){const f=inp.form;if(f?.classList.contains('manutForm')){const sel=f.querySelector('.equipSelect'),idx=Number(sel?.value),eq=(typeof eqs==='function'&&Number.isFinite(idx))?eqs()[idx]:null;return eq?.codigo||`MAN-${Date.now()}`;}if(f?.id==='instalacaoForm')return `INST-${f.querySelector('[name=cliente_id]')?.value||Date.now()}`;if(f?.id==='equipForm')return f.querySelector('[name=codigo]')?.value||`EQUIP-${Date.now()}`;if(f?.id==='orcamentoForm')return `ORC-${f.querySelector('[name=cliente_id]')?.value||Date.now()}`;return `REG-${Date.now()}`}
  async function upload(file,inp){if(!file?.size)return null;if(file.size>10*1024*1024)throw new Error('Cada foto deve ter no máximo 10 MB.');const safe=String(pasta(inp)).replace(/[^a-zA-Z0-9_-]/g,'-');const e=inp.dataset.etapa||'evidencia';const path=`${safe}/${Date.now()}-${crypto.randomUUID()}-${e}.${ext(file)}`;const r=await prevFetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`,{method:'POST',headers:headers({'Content-Type':file.type||'image/jpeg','x-upsert':'false'}),body:file});if(!r.ok)throw new Error(await r.text());return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`}

  function ui(inp){
    let box=inp.parentElement?.querySelector('.multi-fotos-box');if(box)return box;
    box=document.createElement('div');box.className='multi-fotos-box';box.style.cssText='margin-top:7px;display:flex;gap:7px;flex-wrap:wrap;align-items:center';
    const add=document.createElement('button');add.type='button';add.className='action';add.textContent='+ Adicionar outra foto';
    const count=document.createElement('small');count.dataset.multiCount='1';count.style.cssText='color:#45645a;font-weight:700';
    const previews=document.createElement('div');previews.dataset.multiPreview='1';previews.style.cssText='display:flex;gap:5px;flex-wrap:wrap;width:100%';
    add.onclick=()=>{const t=document.createElement('input');t.type='file';t.accept='image/*';t.setAttribute('capture','environment');t.style.display='none';document.body.appendChild(t);t.onchange=async()=>{const fs=[...(t.files||[])];if(fs.length){const arr=extraFiles.get(inp)||[];const seen=new Set(arr.map(fingerprint));for(const f of fs)if(!seen.has(fingerprint(f)))arr.push(f);extraFiles.set(inp,arr);render(inp);for(const f of fs){try{status(inp,'Salvando foto adicional...');const u=await upload(f,inp);if(u)saveStored(inp,[...stored(inp),u]);render(inp);status(inp,'✓ Foto adicional salva na nuvem')}catch(e){console.warn(e);status(inp,'Foto adicional mantida para salvar com o registro')}}}t.remove()};t.click()};
    box.append(add,count,previews);inp.insertAdjacentElement('afterend',box);return box;
  }
  function status(inp,txt){let s=inp.parentElement?.querySelector('.multi-fotos-status');if(!s){s=document.createElement('small');s.className='multi-fotos-status';s.style.cssText='display:block;width:100%;color:#355b49';ui(inp).appendChild(s)}s.textContent=txt}
  function total(inp){return (inp.files?.length||0)+(extraFiles.get(inp)?.length||0)+stored(inp).length}
  function render(inp){const box=ui(inp),c=box.querySelector('[data-multi-count]');if(c)c.textContent=`${total(inp)} foto(s) registrada(s) nesta etapa`;const p=box.querySelector('[data-multi-preview]');if(p){p.innerHTML='';for(const f of (extraFiles.get(inp)||[])){const im=document.createElement('img');im.src=URL.createObjectURL(f);im.style.cssText='width:58px;height:58px;object-fit:cover;border-radius:6px;border:1px solid #ccd9d3';p.appendChild(im)}for(const u of stored(inp)){const im=document.createElement('img');im.src=u;im.style.cssText='width:58px;height:58px;object-fit:cover;border-radius:6px;border:1px solid #ccd9d3';p.appendChild(im)}}}
  function preparar(root=document){
    root.querySelectorAll?.('.manutForm input[type=file],#instalacaoForm input[type=file],#equipForm input[type=file],#orcamentoForm input[type=file],#analiseForm input[type=file]').forEach((inp,i)=>{
      if(inp.dataset.multiHotfix==='1')return;inp.dataset.multiHotfix='1';inp.multiple=true;if(!inp.dataset.etapa)inp.dataset.etapa=etapa(inp,i);
      inp.addEventListener('change',async()=>{render(inp);const fs=[...(inp.files||[])].slice(1);for(const f of fs){try{status(inp,'Salvando fotos adicionais...');const u=await upload(f,inp);if(u)saveStored(inp,[...stored(inp),u]);}catch(e){console.warn(e)}}render(inp);if(fs.length)status(inp,'✓ Fotos adicionais salvas na nuvem')});
      render(inp);
    });
  }
  function extrasUrlsPorEtapa(form){const g={antes:[],durante:[],depois:[],evidencia:[],analise:[]};[...form.querySelectorAll('input[type=file]')].forEach((inp,i)=>{const e=etapa(inp,i);g[e]=uniq([...(g[e]||[]),...stored(inp)])});return g}

  window.fetch=async function(input,init={}){
    const url=typeof input==='string'?input:input?.url||'';const method=String(init?.method||(typeof input!=='string'&&input?.method)||'GET').toUpperCase();
    if(init?.body&&(method==='POST'||method==='PATCH')){
      try{
        const body=JSON.parse(init.body);
        if(/\/rest\/v1\/manutencoes(?:\?|$)/.test(url)){
          const f=document.querySelector('.manutForm:not([style*="display: none"])')||document.querySelector('.manutForm');if(f){const g=extrasUrlsPorEtapa(f);body.fotos_antes=uniq([...urls(body.fotos_antes),...urls(body.foto_antes),...g.antes]);body.fotos_durante=uniq([...urls(body.fotos_durante),...urls(body.foto_durante),...g.durante]);body.fotos_depois=uniq([...urls(body.fotos_depois),...urls(body.foto_depois),...g.depois]);init={...init,body:JSON.stringify(body)}}
        }else if(/\/rest\/v1\/instalacoes(?:\?|$)/.test(url)){
          const f=document.getElementById('instalacaoForm');if(f){const g=extrasUrlsPorEtapa(f);body.fotos_antes=uniq([...urls(body.fotos_antes),...urls(body.foto_antes),...g.antes]);body.fotos_durante=uniq([...urls(body.fotos_durante),...urls(body.foto_durante),...g.durante]);body.fotos_depois=uniq([...urls(body.fotos_depois),...urls(body.foto_depois),...g.depois]);init={...init,body:JSON.stringify(body)}}
        }else if(/\/rest\/v1\/equipamentos(?:\?|$)/.test(url)){
          const f=document.getElementById('equipForm');if(f){const g=extrasUrlsPorEtapa(f),all=uniq(Object.values(g).flat());body.fotos=uniq([...urls(body.fotos),...all]);init={...init,body:JSON.stringify(body)}}
        }else if(/\/rest\/v1\/orcamentos(?:\?|$)/.test(url)){
          const f=document.getElementById('orcamentoForm');if(f){const g=extrasUrlsPorEtapa(f),all=uniq(Object.values(g).flat());body.fotos_vistoria=uniq([...urls(body.fotos_vistoria),...all]);init={...init,body:JSON.stringify(body)}}
        }else if(/\/rest\/v1\/analises(?:\?|$)/.test(url)){
          const f=document.getElementById('analiseForm');if(f){const g=extrasUrlsPorEtapa(f),all=uniq(Object.values(g).flat());body.fotos=uniq([...urls(body.fotos),...all]);init={...init,body:JSON.stringify(body)}}
        }
      }catch(e){console.warn('Hotfix múltiplas fotos: payload não alterado',e)}
    }
    return prevFetch(input,init)
  };

  new MutationObserver(m=>{for(const x of m)for(const n of x.addedNodes)if(n.nodeType===1)preparar(n)}).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>preparar());else preparar();
})();
