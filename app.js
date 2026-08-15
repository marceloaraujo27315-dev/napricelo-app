const $=s=>document.querySelector(s);
const db={
 get:(k)=>JSON.parse(localStorage.getItem(k)||"[]"),
 set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))
};
function showPage(id){document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));$("#"+id).classList.add("active");scrollTo(0,0);if(id==="historico")renderHistorico("equip")}
const configs={
 biodigestor:{titulo:"POP – Manutenção de Biodigestor",prefixo:"BD",checks:["Identificação/código conferido","Tampas e acessos em condição adequada","Tubulações de entrada e saída verificadas","Registro/dispositivo de descarga verificado","Ausência de vazamentos","Condição do lodo/efluente avaliada","Leito de secagem verificado","Condição do entorno verificada"],campos:["Descarga de lodo realizada?","Ocupação do leito / nível","Material seco retirado?","Anomalias / ações necessárias"]},
 gordura:{titulo:"POP – Caixa de Gordura",prefixo:"CG",checks:["Identificação/código conferido","Tampa e acesso verificados","Acúmulo de gordura avaliado","Sólidos e resíduos retirados","Entrada e saída desobstruídas","Limpeza concluída","Condição final sem vazamentos"],campos:["Volume/condição do material retirado","Acondicionamento / permanência","Anomalias / recomendações"]},
 sao:{titulo:"POP – Caixa Separadora de Água e Óleo – SAO",prefixo:"SAO",checks:["Identificação/código conferido","Inspeção antes da abertura","Tampas e acessos verificados","Lama/barro e sólidos avaliados","Material oleoso avaliado","Compartimentos acessíveis limpos","Material acondicionado em recipiente compatível e fechado","Condição hidráulica final verificada"],campos:["Quantidade/condição do material retirado","Acondicionamento temporário","Não conformidades / recomendações"]}
};
function popHTML(tipo){
 const c=configs[tipo];
 return `<h2>${c.titulo}</h2><p>Registro de campo vinculado ao código individual do equipamento.</p>
 <form class="manutForm" data-tipo="${tipo}">
 <label>Código do equipamento<input name="codigo" placeholder="${c.prefixo}-01" required></label>
 <label>Cliente / unidade<input name="cliente" required></label>
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
$("#equipForm").addEventListener("submit",e=>{e.preventDefault();let a=db.get("equip");a.push({...Object.fromEntries(new FormData(e.target)),criado:new Date().toLocaleString("pt-BR")});db.set("equip",a);alert("Equipamento salvo.");e.target.reset();showPage("home")});
document.querySelectorAll(".manutForm").forEach(f=>f.addEventListener("submit",e=>{e.preventDefault();let fd=new FormData(e.target),o={tipo:e.target.dataset.tipo,criado:new Date().toLocaleString("pt-BR")};for(let [k,v] of fd.entries())if(!(v instanceof File))o[k]=v;o.checks=[...e.target.querySelectorAll('input[type=checkbox]')].map(x=>x.checked);let a=db.get("manut");a.push(o);db.set("manut",a);alert("Manutenção salva.");e.target.reset();showPage("home")}));
$("#tipo").addEventListener("change",e=>{let p={"Biodigestor":"BD","Caixa de Gordura":"CG","SAO":"SAO","Ecobio Reator":"ER"}[e.target.value];$("#codigo").placeholder=`Ex.: ${p}-01`});
function renderHistorico(tipo){
 let el=$("#listaHistorico"),a=db.get(tipo);
 if(!a.length){el.innerHTML="<p>Nenhum registro salvo ainda.</p>";return}
 el.innerHTML=a.slice().reverse().map(x=>`<div class="record"><b>${x.codigo||x.tipo}</b><small>${x.cliente||""} ${x.unidade?"• "+x.unidade:""}</small><small>${x.data||x.criado||""}</small></div>`).join("");
}
function exportar(){
 let data={equipamentos:db.get("equip"),manutencoes:db.get("manut"),exportado:new Date().toISOString()};
 let blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),a=document.createElement("a");
 a.href=URL.createObjectURL(blob);a.download="napricelo-registros.json";a.click();URL.revokeObjectURL(a.href);
}
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js");