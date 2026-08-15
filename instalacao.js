function preencherClientesInstalacao(){
  const c=document.getElementById('instClienteSelect'),u=document.getElementById('instUnidadeSelect');
  if(!c||!u)return;
  c.innerHTML='<option value="">Selecione...</option>'+clientesCache.map(x=>`<option value="${x.id}">${escHtml(x.nome)}</option>`).join('');
  preencherUnidadesInstalacao();
}
function preencherUnidadesInstalacao(){
  const c=document.getElementById('instClienteSelect'),u=document.getElementById('instUnidadeSelect');if(!c||!u)return;
  const cid=Number(c.value);const us=unidadesCache.filter(x=>Number(x.cliente_id)===cid);
  u.innerHTML='<option value="">Sem unidade</option>'+us.map(x=>`<option value="${x.id}">${escHtml(x.nome)}</option>`).join('');
  const cl=clientesCache.find(x=>Number(x.id)===cid);if(cl)document.getElementById('instMunicipio').value=cl.municipio||'';
}
function aplicarUnidadeInstalacao(){const u=unidadesCache.find(x=>Number(x.id)===Number(document.getElementById('instUnidadeSelect')?.value));if(u?.municipio)document.getElementById('instMunicipio').value=u.municipio;}
function produtoInstalacaoMudou(){const p=document.getElementById('instProduto')?.value||'';const lab=document.getElementById('instVolumeLabel');if(!lab)return;lab.firstChild.textContent=p==='Sistema para Queijeira'?'Capacidade / vazão do sistema':'Volume / capacidade';}
async function salvarInstalacao(form){
  const fd=new FormData(form),o=Object.fromEntries([...fd.entries()].filter(([,v])=>!(v instanceof File)));
  const cl=clientesCache.find(x=>Number(x.id)===Number(o.cliente_id)),un=unidadesCache.find(x=>Number(x.id)===Number(o.unidade_id));
  const checks=[...form.querySelectorAll('input[type="checkbox"][data-check]')].map(x=>({item:x.dataset.check,ok:x.checked}));
  const files=[...form.querySelectorAll('input[type="file"]')];const fotos={};
  const btn=form.querySelector('button.primary');
  try{
    if(btn){btn.disabled=true;btn.textContent='Salvando instalação...';}
    const etapas=['antes','durante','depois'];
    for(let i=0;i<files.length;i++){if(files[i].files?.[0]&&typeof uploadFotoManutencao==='function')fotos[etapas[i]]=await uploadFotoManutencao(files[i].files[0],`INST-${Date.now()}`,etapas[i]);}
    const payload={cliente_id:cl?.id||null,unidade_id:un?.id||null,cliente:cl?.nome||null,unidade:un?.nome||null,municipio:o.municipio||null,data:o.data||null,responsavel_tecnico:o.responsavel_tecnico||null,produto:o.produto||null,volume:o.volume||null,local_instalacao:o.local_instalacao||null,origem_efluente:o.origem_efluente||null,checklist:checks,observacoes:o.observacoes||null,foto_antes:fotos.antes||null,foto_durante:fotos.durante||null,foto_depois:fotos.depois||null};
    const r=await fetch(`${SUPABASE_URL}/rest/v1/instalacoes`,{method:'POST',headers:{...SUPABASE_HEADERS,Prefer:'return=representation'},body:JSON.stringify(payload)});if(!r.ok)throw new Error(await r.text());
    alert('POP de instalação salvo na nuvem.');form.reset();produtoInstalacaoMudou();showPage('home');
  }catch(err){console.error(err);alert('Não foi possível salvar o POP de instalação.');}
  finally{if(btn){btn.disabled=false;btn.textContent='Salvar instalação';}}
}
(function iniciarPOPInstalacao(){
  const form=document.getElementById('instalacaoForm');if(!form)return;
  document.getElementById('instClienteSelect')?.addEventListener('change',preencherUnidadesInstalacao);
  document.getElementById('instUnidadeSelect')?.addEventListener('change',aplicarUnidadeInstalacao);
  document.getElementById('instProduto')?.addEventListener('change',produtoInstalacaoMudou);
  form.addEventListener('submit',e=>{e.preventDefault();salvarInstalacao(form);});
  setTimeout(preencherClientesInstalacao,300);produtoInstalacaoMudou();
  const baseShow=showPage;showPage=function(id){baseShow(id);if(id==='instalacao'){if(!clientesCache.length)carregarClientesUnidades().then(preencherClientesInstalacao);else preencherClientesInstalacao();}};
})();