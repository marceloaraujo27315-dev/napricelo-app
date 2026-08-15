const $=s=>document.querySelector(s);
const db={get:k=>JSON.parse(localStorage.getItem(k)||"[]"),set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};

function showPage(id){
  document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
  $("#"+id).classList.add("active");
  if(id==="historico")renderHistorico("equip");
  if(["biodigestor","gordura","sao","analise"].includes(id))refreshEquipSelectors();
  scrollTo(0,0);
}

function equipId(e){return e.codigo||`${e.tipo}-${Math.random()}`}
function equipLabel(e){return `${e.codigo} — ${e.cliente||""}${e.unidade?" / "+e.unidade:""}`}

function refreshEquipSelectors(){
  const eq=db.get("equip");
  document.querySelectorAll(".equipSelect").forEach(sel=>{
    const atual=sel.value;
    sel.innerHTML='<option value="">Selecione...</option>'+eq.map((e,i)=>`<option value="${i}">${equipLabel(e)}</option>`).join("");
    if(atual)sel.value=atual;
  });
  const a=$("#analiseEquip");
  if(a){
    const atual=a.value;
    a.innerHTML='<option value="">Selecione...</option>'+eq.map((e,i)=>`<option value="${i}">${equipLabel(e)}</option>`).join("");
    if(atual)a.value=atual;
    updateAutoAnalise();
  }
}

const configs={
 biodigestor:{titulo:"POP – Manutenção de Biodigestor",checks:["Identificação/código conferido","Tampas e acessos em condição adequada","Tubulações de entrada e saída verificadas","Registro/dispositivo de descarga verificado","Ausência de vazamentos","Condição do lodo/efluente avaliada","Leito de secagem verificado","Condição do entorno verificada"],campos:["Descarga de lodo realizada?","Ocupação do leito / nível","Material seco retirado?","Anomalias / ações necessárias"]},
 gordura:{titulo:"POP – Caixa de Gordura",checks:["Identificação/código conferido","Tampa e acesso verificados","Acúmulo de gordura avaliado","Sólidos e resíduos retirados","Entrada e saída desobstruídas","Limpeza concluída","Condição final sem vazamentos"],campos:["Volume/condição do material retirado","Acondicionamento / permanência","Anomalias / recomendações"]},
 sao:{titulo:"POP – Caixa Separadora de Água e Óleo – SAO",checks:["Identificação/código conferido","Inspeção antes da abertura","Tampas e acessos verificados","Lama/barro e sólidos avaliados","Material oleoso avaliado","Compartimentos acessíveis limpos","Material acondicionado em recipiente compatível e fechado","Condição hidráulica final verificada"],campos:["Quantidade/condição do material retirado","Acondicionamento temporário","Não conformidades / recomendações"]}
};

function popHTML(tipo){
 const c=configs[tipo];
 return `<h2>${c.titulo}</h2><p>Selecione um equipamento já cadastrado para evitar redigitação.</p>
 <form class="manutForm" data-tipo="${tipo}">
 <label>Equipamento cadastrado<select class="equipSelect" name="equip_index" required></select></label>
 <div class="autobox equipAuto">Selecione o equipamento.</div>
 <label>Data<input name="data" type="date" required></label>
 <label>Técnico responsável<input name="tecnico"></label>
 <h3>Checklist</h3>${c.checks.map((x,i)=>`<label class="check"><input type="checkbox" name="ck${i}"> <span>${x}</span></label>`).join("")}
 ${c.campos.map((x,i)=>`<label>${x}<textarea name="campo${i}"></textarea></label>`).join("")}
 <h3>Registro fotográfico</h3>
 <div class="photo">Antes<input type="file" accept="image/*" capture="environment"></div>
 <div class="photo">Durante<input type="file" accept="image/*" capture="environment"></div>
 <div class="photo">Depois<input type="file" accept="image/*" capture="environment"></div>
 <label>Observações finais<textarea name="observacoes"></textarea></label>
 <button class="primary">Salvar manutenção</button></form>`;
}
["biodigestor","gordura","sao"].forEach(t=>$("#"+t+" .pop").innerHTML=popHTML(t));

$("#equipForm").addEventListener("submit",e=>{
  e.preventDefault();
  const o={...Object.fromEntries(new FormData(e.target)),criado:new Date().toLocaleString("pt-BR")};
  const a=db.get("equip");
  if(a.some(x=>x.codigo?.trim().toLowerCase()===o.codigo.trim().toLowerCase())) return alert("Já existe equipamento com esse código.");
  a.push(o);db.set("equip",a);alert("Equipamento salvo.");e.target.reset();refreshEquipSelectors();showPage("home");
});

document.querySelectorAll(".manutForm").forEach(f=>{
  const sel=f.querySelector(".equipSelect"), box=f.querySelector(".equipAuto");
  sel.addEventListener("change",()=>{
    const e=db.get("equip")[Number(sel.value)];
    box.innerHTML=e?`<b>${e.codigo}</b><br>${e.cliente||""}${e.unidade?" • "+e.unidade:""}<br>${e.municipio||""}${e.local?" • "+e.local:""}`:"Selecione o equipamento.";
  });
  f.addEventListener("submit",ev=>{
    ev.preventDefault();
    const idx=Number(sel.value),eq=db.get("equip")[idx];
    if(!eq)return alert("Selecione um equipamento.");
    const fd=new FormData(f),o={tipo:f.dataset.tipo,equip_index:idx,codigo:eq.codigo,cliente:eq.cliente,unidade:eq.unidade,municipio:eq.municipio,local:eq.local,criado:new Date().toLocaleString("pt-BR")};
    for(let [k,v] of fd.entries())if(!(v instanceof File))o[k]=v;
    o.checks=[...f.querySelectorAll('input[type=checkbox]')].map(x=>x.checked);
    const a=db.get("manut");a.push(o);db.set("manut",a);alert("Manutenção salva.");f.reset();box.textContent="Selecione o equipamento.";showPage("home");
  });
});

$("#analiseEquip").addEventListener("change",updateAutoAnalise);
function updateAutoAnalise(){
 const idx=$("#analiseEquip").value,box=$("#analiseAuto");
 const e=db.get("equip")[Number(idx)];
 box.innerHTML=e?`<b>${e.codigo}</b><br>${e.cliente||""}${e.unidade?" • "+e.unidade:""}<br>${e.municipio||""}${e.local?" • "+e.local:""}<br>${e.tipo||""}${e.capacidade?" • "+e.capacidade:""}`:"Selecione o equipamento.";
}
$("#analiseForm").addEventListener("submit",e=>{
 e.preventDefault();
 const idx=Number($("#analiseEquip").value),eq=db.get("equip")[idx];
 if(!eq)return alert("Selecione um equipamento.");
 const fd=new FormData(e.target),o={equip_index:idx,codigo:eq.codigo,cliente:eq.cliente,unidade:eq.unidade,municipio:eq.municipio,local:eq.local,tipo:eq.tipo,criado:new Date().toLocaleString("pt-BR")};
 for(let [k,v] of fd.entries())if(!(v instanceof File))o[k]=v;
 const a=db.get("analises");a.push(o);db.set("analises",a);alert("Análise salva.");e.target.reset();updateAutoAnalise();showPage("home");
});

$("#tipo").addEventListener("change",e=>{let p={"Biodigestor":"BD","Caixa de Gordura":"CG","SAO":"SAO","Ecobio Reator":"ER"}[e.target.value];$("#codigo").placeholder=`Ex.: ${p}-01`});

function renderHistorico(tipo){
 const el=$("#listaHistorico"),a=db.get(tipo);
 if(!a.length){el.innerHTML="<p>Nenhum registro salvo ainda.</p>";return}
 el.innerHTML=a.slice().reverse().map((x,rev)=>{
   const real=a.length-1-rev;
   let extra="";
   if(tipo==="analises") extra=`<small>pH: ${x.ph||"-"} • Temp.: ${x.temperatura||"-"} °C • ${x.ponto||""}</small>`;
   return `<div class="record"><b>${x.codigo||x.tipo}</b><small>${x.cliente||""}${x.unidade?" • "+x.unidade:""}</small><small>${x.data||x.criado||""}</small>${extra}<button class="action" onclick="verDetalhe('${tipo}',${real})">Ver detalhes</button> <button class="action" onclick="excluir('${tipo}',${real})">Excluir</button></div>`;
 }).join("");
}

function verDetalhe(tipo,i){
 const x=db.get(tipo)[i]; if(!x)return;
 let txt=`Código: ${x.codigo||""}\nCliente: ${x.cliente||""}\nUnidade: ${x.unidade||""}\nData: ${x.data||x.criado||""}\n`;
 if(tipo==="analises") txt+=`Responsável: ${x.responsavel||""}\nPonto: ${x.ponto||""}\npH: ${x.ph||""}\nTemperatura: ${x.temperatura||""} °C\nAspecto: ${x.aspecto||""}\nOdor: ${x.odor||""}\nDBO: ${x.dbo||""}\nDQO: ${x.dqo||""}\nSólidos: ${x.solidos||""}\nÓleos e graxas: ${x.oleos||""}\nObservações: ${x.observacoes||""}`;
 else txt+=`Técnico: ${x.tecnico||""}\nObservações: ${x.observacoes||""}`;
 alert(txt);
}

function excluir(tipo,i){
 if(!confirm("Excluir este registro?"))return;
 const a=db.get(tipo);a.splice(i,1);db.set(tipo,a);renderHistorico(tipo);
}
function exportar(){
 const data={equipamentos:db.get("equip"),manutencoes:db.get("manut"),analises:db.get("analises"),exportado:new Date().toISOString()};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),a=document.createElement("a");
 a.href=URL.createObjectURL(blob);a.download="napricelo-registros-v2.json";a.click();URL.revokeObjectURL(a.href);
}
refreshEquipSelectors();
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js");