(()=>{
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const PRODUTOS=['Biodigestor','Fossa séptica','Caixa de gordura','Caixa separadora de água e óleo','Sistema para Queijeira'];
  const TECNICOS=['Marcelo de Araujo Santos','Marco Antônio de Araujo Santos','ANDRÉ CICERO'];
  async function carregar(id){
    const cache=window.historicoInstalacoesCache?.find?.(x=>Number(x.id)===Number(id));
    if(cache)return cache;
    const r=await fetch(`${SUPABASE_URL}/rest/v1/instalacoes?select=*&id=eq.${Number(id)}&limit=1`,{headers:SUPABASE_HEADERS});
    if(!r.ok)throw new Error(await r.text());
    return (await r.json())[0]||null;
  }
  function sel(opts,atual){return opts.map(v=>`<option ${String(v)===String(atual)?'selected':''}>${esc(v)}</option>`).join('')}
  function compObj(x){const m={};(Array.isArray(x.componentes)?x.componentes:[]).forEach(c=>m[c.campo]=c.valor||'');return m}
  function abrirModal(x){
    document.getElementById('modalCorrigirInstalacao')?.remove();
    const c=compObj(x),checks=Array.isArray(x.checklist)?x.checklist:[];
    const m=document.createElement('div');m.id='modalCorrigirInstalacao';m.style.cssText='position:fixed;inset:0;background:#0008;z-index:99999;overflow:auto;padding:18px';
    m.innerHTML=`<div style="max-width:820px;margin:0 auto;background:#fff;border-radius:14px;padding:18px;box-shadow:0 10px 40px #0004">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:center"><div><small style="color:#176b45;font-weight:700">CORREÇÃO DO REGISTRO</small><h2 style="margin:3px 0 0">POP de instalação #${Number(x.id)}</h2></div><button type="button" class="action" id="fecharCorrInst">Fechar</button></div>
      <p style="background:#f3f8f5;padding:10px;border-radius:8px">A correção atualiza o mesmo registro. As fotos e a TRT já anexadas são preservadas.</p>
      <form id="formCorrInst">
        <div class="two"><label>Data<input name="data" type="date" value="${esc(String(x.data||'').slice(0,10))}"></label><label>Responsável técnico<select name="responsavel_tecnico">${sel([...new Set([x.responsavel_tecnico,...TECNICOS].filter(Boolean))],x.responsavel_tecnico)}</select></label></div>
        <label>Produto / sistema<select name="produto">${sel([...new Set([x.produto,...PRODUTOS].filter(Boolean))],x.produto)}</select></label>
        <label>Volume / capacidade<input name="volume" value="${esc(x.volume||'')}"></label>
        <label>Município<input name="municipio" value="${esc(x.municipio||'')}"></label>
        <label>Local da instalação / setor<input name="local_instalacao" value="${esc(x.local_instalacao||'')}"></label>
        <label>Origem do efluente<textarea name="origem_efluente">${esc(x.origem_efluente||'')}</textarea></label>
        ${Object.keys(c).length?`<h3>Componentes / volumes</h3><div class="two">${Object.entries(c).map(([k,v])=>`<label>${esc((typeof ROTULOS_COMPONENTES_INST!=='undefined'&&ROTULOS_COMPONENTES_INST[k])||k)}<input data-comp="${esc(k)}" value="${esc(v)}"></label>`).join('')}</div>`:''}
        <h3>Checklist</h3><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:7px">${checks.map((q,i)=>`<label class="check"><input type="checkbox" data-ck="${i}" ${q.ok?'checked':''}> <span>${esc(q.item||'Item')}</span></label>`).join('')||'<small>Checklist não informado.</small>'}</div>
        <label>Observações / recomendações<textarea name="observacoes" rows="5">${esc(x.observacoes||'')}</textarea></label>
        <button class="primary" type="submit">Salvar correção</button>
      </form>
    </div>`;
    document.body.appendChild(m);m.querySelector('#fecharCorrInst').onclick=()=>m.remove();
    m.querySelector('#formCorrInst').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,btn=f.querySelector('button[type=submit]');try{btn.disabled=true;btn.textContent='Salvando correção...';const fd=new FormData(f);const componentes=[...f.querySelectorAll('[data-comp]')].map(i=>({campo:i.dataset.comp,valor:i.value.trim()})).filter(z=>z.valor);const checklist=checks.map((q,i)=>({...q,ok:!!f.querySelector(`[data-ck="${i}"]`)?.checked}));const payload={data:fd.get('data')||null,responsavel_tecnico:fd.get('responsavel_tecnico')||null,produto:fd.get('produto')||null,volume:fd.get('volume')||null,municipio:fd.get('municipio')||null,local_instalacao:fd.get('local_instalacao')||null,origem_efluente:fd.get('origem_efluente')||null,observacoes:fd.get('observacoes')||null,componentes,checklist};const r=await fetch(`${SUPABASE_URL}/rest/v1/instalacoes?id=eq.${Number(x.id)}`,{method:'PATCH',headers:{...SUPABASE_HEADERS,Prefer:'return=representation'},body:JSON.stringify(payload)});if(!r.ok)throw new Error(await r.text());const novo=(await r.json())[0];const idx=window.historicoInstalacoesCache?.findIndex?.(z=>Number(z.id)===Number(x.id));if(idx>=0)window.historicoInstalacoesCache[idx]=novo;alert('Correção salva no mesmo POP de instalação.');m.remove();if(typeof renderHistoricoInstalacoes==='function')await renderHistoricoInstalacoes();if(typeof abrirInstalacaoPorId==='function')setTimeout(()=>abrirInstalacaoPorId(x.id),120);}catch(err){console.error(err);alert('Não foi possível salvar a correção.');}finally{btn.disabled=false;btn.textContent='Salvar correção';}};
  }
  window.corrigirInstalacao=async function(id){try{const x=await carregar(id);if(!x)return alert('Instalação não encontrada.');abrirModal(x);}catch(e){console.error(e);alert('Não foi possível abrir a correção da instalação.');}}
  function injetar(){
    const cont=document.getElementById('detailContent');if(!cont)return;
    const rel=cont.querySelector('button[onclick*="gerarRelatorioInstalacao"]');if(!rel||cont.querySelector('[data-corrigir-inst]'))return;
    const m=String(rel.getAttribute('onclick')||'').match(/gerarRelatorioInstalacao\((\d+)\)/);if(!m)return;
    const b=document.createElement('button');b.type='button';b.className='action';b.dataset.corrigirInst='1';b.textContent='Corrigir POP / instalação';b.onclick=()=>corrigirInstalacao(Number(m[1]));rel.insertAdjacentElement('beforebegin',b);
  }
  new MutationObserver(injetar).observe(document.documentElement,{childList:true,subtree:true});setInterval(injetar,1200);setTimeout(injetar,500);
})();
