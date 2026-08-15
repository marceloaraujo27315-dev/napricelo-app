function escEq(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function tipoPaginaManut(tipo){const t=String(tipo||"").toLowerCase();if(t.includes("gordura"))return "gordura";if(t==="sao"||t.includes("água e óleo")||t.includes("agua e oleo"))return "sao";return "biodigestor";}
function acharIndiceEquip(id){return eqs().findIndex(e=>Number(e.id)===Number(id));}
function abrirFichaEquipamento(id){
  const e=clienteFichaCache.equip.find(x=>Number(x.id)===Number(id))||eqs().find(x=>Number(x.id)===Number(id));if(!e)return;
  const manut=clienteFichaCache.manut.filter(x=>Number(x.equipamento_id)===Number(e.id));
  const analises=clienteFichaCache.analises.filter(x=>Number(x.equipamento_id)===Number(e.id));
  const unidade=(typeof unidadesCache!=="undefined"?unidadesCache:[]).find(u=>Number(u.id)===Number(e.unidade_id));
  const cliente=(typeof clientesCache!=="undefined"?clientesCache:[]).find(c=>Number(c.id)===Number(e.cliente_id));
  const st=typeof statusPeriodicidade==="function"?statusPeriodicidade(e):{classe:"sem-periodo",texto:"Periodicidade não definida"};
  let modal=document.getElementById("equipProfileModal");
  if(!modal){modal=document.createElement("div");modal.id="equipProfileModal";modal.className="detail-modal";modal.innerHTML='<div class="detail-sheet equip-profile-sheet"><button class="detail-close" onclick="fecharFichaEquipamento()">×</button><div id="equipProfileContent"></div></div>';document.body.appendChild(modal);}
  document.getElementById("equipProfileContent").innerHTML=`
    <div class="detail-head"><small>FICHA DO EQUIPAMENTO</small><h2>${escEq(e.codigo||"Sem código")}</h2><p>${escEq(e.tipo||"")}${e.capacidade?" • "+escEq(e.capacidade):""}</p></div>
    <div class="equip-actions"><button onclick="iniciarManutencaoEquip(${e.id})">Nova manutenção</button><button onclick="iniciarAnaliseEquip(${e.id})">Nova análise</button><button onclick="document.getElementById('equipHistory').scrollIntoView({behavior:'smooth'})">Histórico completo</button></div>
    <div class="period-card ${escEq(st.classe)}"><div><b>Controle de periodicidade</b><span>${e.periodicidade_meses?`A cada ${e.periodicidade_meses} mês(es)`:"Não definida"}</span></div><div><b>Próxima manutenção</b><span>${typeof fmtPeriodoData==="function"?fmtPeriodoData(e.proxima_manutencao):(e.proxima_manutencao||"—")}</span></div><div class="period-status">${escEq(st.texto)}</div><button onclick="definirPeriodicidadeEquipamento(${e.id})">Alterar periodicidade</button></div>
    <div class="profile-info-grid"><div><b>Cliente</b><span>${escEq(cliente?.nome||e.cliente||"—")}</span></div><div><b>Unidade</b><span>${escEq(unidade?.nome||e.unidade||"—")}</span></div><div><b>Município</b><span>${escEq(e.municipio||unidade?.municipio||cliente?.municipio||"—")}</span></div><div><b>Localização / setor</b><span>${escEq(e.localizacao||"—")}</span></div><div><b>Marca / modelo</b><span>${escEq(e.modelo||"—")}</span></div><div><b>Capacidade</b><span>${escEq(e.capacidade||"—")}</span></div></div>
    <div class="profile-stats"><div><b>${manut.length}</b><span>Manutenções</span></div><div><b>${analises.length}</b><span>Análises</span></div><div><b>${manut[0]?fmtData(manut[0].data||manut[0].created_at):"—"}</b><span>Última manutenção</span></div><div><b>${analises[0]?fmtData(analises[0].data||analises[0].created_at):"—"}</b><span>Última análise</span></div></div>
    ${e.observacoes?`<h3>Observações do equipamento</h3><div class="detail-note">${escEq(e.observacoes)}</div>`:""}
    <h3 id="equipHistory">Histórico completo</h3>${historicoEquipHtml(manut,analises)}
  `;
  modal.classList.add("open");document.body.style.overflow="hidden";
}
function fecharFichaEquipamento(){const m=document.getElementById("equipProfileModal");if(m)m.classList.remove("open");document.body.style.overflow="hidden";}
function historicoEquipHtml(manut,analises){
  const itens=[...manut.map(x=>({...x,_cat:"Manutenção",_data:x.data||x.created_at})),...analises.map(x=>({...x,_cat:"Análise",_data:x.data||x.created_at}))].sort((a,b)=>new Date(b._data)-new Date(a._data));
  if(!itens.length)return '<p class="muted">Nenhuma manutenção ou análise registrada para este equipamento.</p>';
  return `<div class="equip-history">${itens.map(x=>`<div><div><b>${escEq(x._cat)}</b><span>${fmtData(x._data)}</span></div><small>${x.tecnico?"Responsável: "+escEq(x.tecnico):x.responsavel?"Responsável: "+escEq(x.responsavel):""}${x.ponto?" • Ponto: "+escEq(x.ponto):""}</small>${x.observacoes?`<p>${escEq(x.observacoes)}</p>`:""}</div>`).join("")}</div>`;
}
function prepararSelecaoEquip(page,id){fecharFichaEquipamento();fecharFichaCliente();showPage(page);refreshEquipSelectors();const idx=acharIndiceEquip(id);if(idx<0)return alert("Equipamento não encontrado na lista atual.");setTimeout(()=>{const sel=page==="analise"?document.getElementById("analiseEquip"):document.querySelector(`#${page} .equipSelect`);if(sel){sel.value=String(idx);sel.dispatchEvent(new Event("change",{bubbles:true}));sel.scrollIntoView({behavior:"smooth",block:"center"});}},100);}
function iniciarManutencaoEquip(id){const e=clienteFichaCache.equip.find(x=>Number(x.id)===Number(id))||eqs().find(x=>Number(x.id)===Number(id));if(!e)return;prepararSelecaoEquip(tipoPaginaManut(e.tipo),id);}
function iniciarAnaliseEquip(id){prepararSelecaoEquip("analise",id);}
const cartaoEquipClienteBase=window.cartaoEquipCliente;
window.cartaoEquipCliente=function(e,manut,analises){const ms=manut.filter(x=>Number(x.equipamento_id)===Number(e.id));const as=analises.filter(x=>Number(x.equipamento_id)===Number(e.id));const ultimaM=ms[0],ultimaA=as[0];const st=typeof statusPeriodicidade==="function"?statusPeriodicidade(e):null;return `<div class="profile-equip clickable-equip" onclick="abrirFichaEquipamento(${e.id})"><div class="profile-equip-main"><b>${escEq(e.codigo||"Sem código")}</b><span>${escEq(e.tipo||"")}${e.capacidade?" • "+escEq(e.capacidade):""}</span><small>${escEq(e.localizacao||"")}${e.modelo?" • "+escEq(e.modelo):""}</small></div><div class="profile-equip-meta"><span>${ms.length} manut.</span><span>${as.length} análises</span>${st?`<span class="status-mini ${escEq(st.classe)}">${escEq(st.texto)}</span>`:""}</div><div class="profile-last">${ultimaM?`Última manutenção: <b>${fmtData(ultimaM.data||ultimaM.created_at)}</b>`:"Sem manutenção registrada"}${e.proxima_manutencao?`<br>Próxima manutenção: <b>${fmtPeriodoData(e.proxima_manutencao)}</b>`:""}${ultimaA?`<br>Última análise: <b>${fmtData(ultimaA.data||ultimaA.created_at)}</b>`:""}<br><span class="open-hint">Toque para abrir a ficha do equipamento</span></div></div>`;};
