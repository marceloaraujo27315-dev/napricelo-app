(()=>{
  const AUTH_KEY='napricelo_auth_session';
  const FALLBACK=['Marcelo de Araujo Santos','Marco Antônio de Araujo Santos','ANDRÉ CÍCERO'];
  let nomesAtivos=[...FALLBACK];
  let carregando=false;

  function sessao(){
    try{return JSON.parse(localStorage.getItem(AUTH_KEY)||'null')}catch(_){return null}
  }
  function normal(v){return String(v||'').trim()}
  function unicos(arr){return [...new Set(arr.map(normal).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'))}

  function elegivel(u){
    if(!u||u.ativo===false||!u.nome)return false;
    if(['administrador','tecnico','operacional'].includes(String(u.perfil||'').toLowerCase()))return true;
    const p=u.permissoes||{};
    const caps=[];
    if(Array.isArray(p.allowed))caps.push(...p.allowed);
    if(Array.isArray(p.extras))caps.push(...p.extras);
    return caps.some(x=>['pop','instalacoes','agenda','relatorios'].includes(String(x)));
  }

  async function carregar(){
    if(carregando)return;
    const s=sessao();
    if(!s?.access_token)return aplicarTodos();
    carregando=true;
    try{
      const r=await fetch(`${SUPABASE_URL}/functions/v1/app-directory`,{
        headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${s.access_token}`}
      });
      if(r.ok){
        const d=await r.json();
        const lista=Array.isArray(d.users)?d.users.filter(elegivel).map(u=>u.nome):[];
        nomesAtivos=unicos(lista.length?lista:FALLBACK);
      }
    }catch(e){
      console.warn('Não foi possível carregar responsáveis de campo.',e);
    }finally{
      carregando=false;
      aplicarTodos();
    }
  }

  function eSelectResponsavel(sel){
    if(!sel||sel.tagName!=='SELECT')return false;
    const n=String(sel.name||sel.id||'').toLowerCase();
    if(/responsavel_tecnico|responsavel_execucao|executor/.test(n))return true;
    const lab=sel.closest('label')?.textContent||'';
    return /responsável\s+(técnico|pela execução|da execução)|profissional responsável/i.test(lab);
  }

  function aplicarSelect(sel){
    if(!eSelectResponsavel(sel))return;
    const atual=normal(sel.value);
    const primeiraVazia=Array.from(sel.options).find(o=>!normal(o.value));
    const vazioTexto=primeiraVazia?.textContent||'Selecione...';
    const desejados=unicos([...nomesAtivos, ...(atual?[atual]:[])]);
    const existentes=Array.from(sel.options).filter(o=>normal(o.value)).map(o=>normal(o.value));
    const iguais=existentes.length===desejados.length&&existentes.every((v,i)=>v===desejados[i]);
    if(iguais)return;
    sel.innerHTML=`<option value="">${vazioTexto}</option>`+desejados.map(n=>`<option value="${n.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}">${n.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</option>`).join('');
    if(atual)sel.value=atual;
  }

  function aplicarTodos(root=document){
    root.querySelectorAll?.('select').forEach(aplicarSelect);
  }

  document.addEventListener('focusin',e=>{if(eSelectResponsavel(e.target))aplicarSelect(e.target)},true);
  document.addEventListener('pointerdown',e=>{if(eSelectResponsavel(e.target))aplicarSelect(e.target)},true);
  window.addEventListener('napricelo-auth-changed',()=>setTimeout(carregar,250));
  window.addEventListener('load',()=>{setTimeout(carregar,500);setTimeout(()=>aplicarTodos(),1200);setTimeout(()=>aplicarTodos(),2500)});
  setTimeout(carregar,700);
})();