let clientesCache=[];
let unidadesCache=[];

async function buscarTabelaCadastro(tabela,ordem="id.asc"){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/${tabela}?select=*&order=${ordem}`,{headers:SUPABASE_HEADERS});
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

async function carregarClientesUnidades(){
  const lista=document.getElementById("listaClientesUnidades");
  if(lista) lista.innerHTML="<p>Carregando clientes e unidades...</p>";
  try{
    [clientesCache,unidadesCache]=await Promise.all([
      buscarTabelaCadastro("clientes","nome.asc"),
      buscarTabelaCadastro("unidades","nome.asc")
    ]);
    atualizarSelectsClientes();
    renderClientesUnidades();
  }catch(err){
    console.error(err);
    if(lista) lista.innerHTML="<p>Não foi possível carregar clientes e unidades. Verifique a internet.</p>";
  }
}

function mostrarCadastroCliente(){
  document.getElementById("clienteForm").style.display="block";
  document.getElementById("unidadeForm").style.display="none";
}
function mostrarCadastroUnidade(){
  document.getElementById("clienteForm").style.display="none";
  document.getElementById("unidadeForm").style.display="block";
  atualizarSelectsClientes();
}

function atualizarSelectsClientes(){
  const uc=document.getElementById("unidadeCliente");
  const ec=document.getElementById("equipClienteSelect");
  const eu=document.getElementById("equipUnidadeSelect");
  if(uc){const atual=uc.value;uc.innerHTML='<option value="">Selecione...</option>'+clientesCache.map(c=>`<option value="${c.id}">${escHtml(c.nome)}</option>`).join("");if(atual)uc.value=atual;}
  if(ec){const atual=ec.value;ec.innerHTML='<option value="">Preencher manualmente</option>'+clientesCache.map(c=>`<option value="${c.id}">${escHtml(c.nome)}</option>`).join("");if(atual)ec.value=atual;}
  if(eu){eu.innerHTML='<option value="">Sem unidade / preencher manualmente</option>';if(ec&&ec.value)preencherUnidadesEquipamento();}
}
function escHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

function renderClientesUnidades(){
  const el=document.getElementById("listaClientesUnidades");
  if(!el)return;
  if(!clientesCache.length){el.innerHTML="<p>Nenhum cliente cadastrado ainda.</p>";return;}
  el.innerHTML=clientesCache.map(c=>{
    const us=unidadesCache.filter(u=>Number(u.cliente_id)===Number(c.id));
    return `<div class="record"><b>${escHtml(c.nome)}</b><small>${escHtml(c.documento||"")}${c.municipio?" • "+escHtml(c.municipio):""}</small>${c.responsavel?`<small>Contato: ${escHtml(c.responsavel)}</small>`:""}${us.length?`<div style="margin-top:8px">${us.map(u=>`<div class="autobox" style="margin-top:6px"><b>${escHtml(u.nome)}</b><br>${escHtml(u.municipio||"")}${u.endereco?" • "+escHtml(u.endereco):""}</div>`).join("")}</div>`:'<small>Nenhuma unidade cadastrada.</small>'}</div>`;
  }).join("");
}

async function salvarRegistroCadastro(tabela,payload){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/${tabela}`,{method:"POST",headers:{...SUPABASE_HEADERS,Prefer:"return=representation"},body:JSON.stringify(payload)});
  if(!r.ok)throw new Error(await r.text());
  return (await r.json())[0];
}

document.getElementById("clienteForm")?.addEventListener("submit",async e=>{
  e.preventDefault();
  const o=Object.fromEntries(new FormData(e.target));
  try{
    const salvo=await salvarRegistroCadastro("clientes",{
      nome:o.nome.trim(),documento:o.documento||null,municipio:o.municipio||null,endereco:o.endereco||null,
      responsavel:o.responsavel||null,telefone:o.telefone||null,email:o.email||null,observacoes:o.observacoes||null
    });
    clientesCache.push(salvo);clientesCache.sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR"));
    atualizarSelectsClientes();renderClientesUnidades();e.target.reset();
    alert("Cliente salvo na nuvem.");
  }catch(err){console.error(err);alert("Não foi possível salvar o cliente.");}
});

document.getElementById("unidadeForm")?.addEventListener("submit",async e=>{
  e.preventDefault();
  const o=Object.fromEntries(new FormData(e.target));
  try{
    const salvo=await salvarRegistroCadastro("unidades",{
      cliente_id:Number(o.cliente_id),nome:o.nome.trim(),municipio:o.municipio||null,endereco:o.endereco||null,
      responsavel:o.responsavel||null,observacoes:o.observacoes||null
    });
    unidadesCache.push(salvo);unidadesCache.sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR"));
    renderClientesUnidades();e.target.reset();atualizarSelectsClientes();
    alert("Unidade salva na nuvem.");
  }catch(err){console.error(err);alert("Não foi possível salvar a unidade.");}
});

function preencherUnidadesEquipamento(){
  const ec=document.getElementById("equipClienteSelect"),eu=document.getElementById("equipUnidadeSelect");
  if(!ec||!eu)return;
  const cid=Number(ec.value);
  const us=unidadesCache.filter(u=>Number(u.cliente_id)===cid);
  eu.innerHTML='<option value="">Sem unidade / preencher manualmente</option>'+us.map(u=>`<option value="${u.id}">${escHtml(u.nome)}</option>`).join("");
}
function aplicarClienteNoEquipamento(){
  const form=document.getElementById("equipForm"),ec=document.getElementById("equipClienteSelect"),box=document.getElementById("equipClienteAuto");
  if(!form||!ec)return;
  const c=clientesCache.find(x=>Number(x.id)===Number(ec.value));
  preencherUnidadesEquipamento();
  if(c){form.elements.cliente.value=c.nome||"";form.elements.municipio.value=c.municipio||"";box.innerHTML=`<b>${escHtml(c.nome)}</b><br>${escHtml(c.documento||"")}${c.municipio?" • "+escHtml(c.municipio):""}`;}else box.textContent="Preenchimento manual ativado.";
}
function aplicarUnidadeNoEquipamento(){
  const form=document.getElementById("equipForm"),eu=document.getElementById("equipUnidadeSelect"),box=document.getElementById("equipClienteAuto");
  if(!form||!eu)return;
  const u=unidadesCache.find(x=>Number(x.id)===Number(eu.value));
  if(u){form.elements.unidade.value=u.nome||"";if(u.municipio)form.elements.municipio.value=u.municipio;box.innerHTML+=`<br><b>Unidade:</b> ${escHtml(u.nome)}${u.municipio?" • "+escHtml(u.municipio):""}`;}
}
document.getElementById("equipClienteSelect")?.addEventListener("change",aplicarClienteNoEquipamento);
document.getElementById("equipUnidadeSelect")?.addEventListener("change",aplicarUnidadeNoEquipamento);

const showPageOriginal=window.showPage;
window.showPage=function(id){showPageOriginal(id);if(id==="clientes")carregarClientesUnidades();if(id==="cadastro"&&!clientesCache.length)carregarClientesUnidades();};
carregarClientesUnidades();