let cloudHistorico={equip:[],manut:[],analises:[]};

async function buscarHistoricoNuvem(tipo){
  const tabela=tipo==="equip"?"equipamentos":tipo==="manut"?"manutencoes":"analises";
  const ordem=tipo==="equip"?"id.asc":"created_at.desc";
  const r=await fetch(`${SUPABASE_URL}/rest/v1/${tabela}?select=*&order=${ordem}`,{headers:SUPABASE_HEADERS});
  if(!r.ok)throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  const dados=await r.json(); cloudHistorico[tipo]=dados;
  if(tipo==="equip"){equipCache=dados;db.set("equip",dados);refreshEquipSelectors();}else db.set(tipo,dados);
  return dados;
}
function formatarDataHistorico(v){if(!v)return "";if(/^\d{4}-\d{2}-\d{2}$/.test(v)){const[a,m,d]=v.split("-");return`${d}/${m}/${a}`;}const dt=new Date(v);return Number.isNaN(dt.getTime())?v:dt.toLocaleString("pt-BR");}
function nomeTipoManut(tipo){return {biodigestor:"POP Biodigestor",gordura:"POP Caixa de Gordura",sao:"POP Água e Óleo"}[tipo]||tipo||"";}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

async function renderHistorico(tipo){
 const el=$("#listaHistorico");el.innerHTML="<p>Carregando registros da nuvem...</p>";
 try{const a=await buscarHistoricoNuvem(tipo);if(!a.length){el.innerHTML="<p>Nenhum registro salvo na nuvem ainda.</p>";return;}
 el.innerHTML=a.map((x,i)=>{let extra="";if(tipo==="analises")extra=`<small>pH: ${x.ph??"-"} • Temp.: ${x.temperatura??"-"} °C • ${esc(x.ponto||"")}</small>`;if(tipo==="manut")extra=`<small>${esc(nomeTipoManut(x.tipo))}${x.tecnico?" • "+esc(x.tecnico):""}</small>`;const data=formatarDataHistorico(x.data||x.created_at);return `<div class="record"><b>${esc(x.codigo||nomeTipoManut(x.tipo)||"Registro")}</b><small>${esc(x.cliente||"")}${x.unidade?" • "+esc(x.unidade):""}</small><small>${data}</small>${extra}<button class="action" onclick="verDetalhe('${tipo}',${i})">Ver detalhes</button></div>`;}).join("");
 }catch(err){console.error(err);const local=tipo==="equip"?eqs():db.get(tipo);if(local.length){el.innerHTML='<p><b>Sem conexão.</b> Exibindo a última cópia salva neste aparelho.</p>'+local.slice().reverse().map((x,rev)=>{const i=local.length-1-rev;return `<div class="record"><b>${esc(x.codigo||x.tipo)}</b><small>${esc(x.cliente||"")}${x.unidade?" • "+esc(x.unidade):""}</small><small>${formatarDataHistorico(x.data||x.criado||x.created_at)}</small><button class="action" onclick="verDetalheLocal('${tipo}',${i})">Ver detalhes</button></div>`;}).join("");}else el.innerHTML="<p>Não foi possível acessar o histórico online. Verifique a internet.</p>";}
}

function linha(label,valor){return valor!==null&&valor!==undefined&&valor!==""?`<div class="detail-row"><b>${esc(label)}</b><span>${esc(valor)}</span></div>`:"";}
function fotosManut(x){const fotos=[["Antes",x.foto_antes],["Durante",x.foto_durante],["Depois",x.foto_depois]].filter(f=>f[1]);if(!fotos.length)return '<p class="muted">Nenhuma foto registrada nesta manutenção.</p>';return `<div class="photo-grid">${fotos.map(([n,u])=>`<figure><a href="${esc(u)}" target="_blank" rel="noopener"><img src="${esc(u)}" alt="Foto ${esc(n)}"></a><figcaption>${esc(n)}</figcaption></figure>`).join("")}</div>`;}
function checklistHtml(checks){if(!Array.isArray(checks)||!checks.length)return '<p class="muted">Checklist não informado.</p>';return `<div class="check-detail">${checks.map((v,i)=>`<div>${v?"✓":"○"} Item ${i+1}</div>`).join("")}</div>`;}
function camposHtml(campos){if(!campos||typeof campos!=="object")return "";const itens=Object.entries(campos).filter(([,v])=>v!==""&&v!==null&&v!==undefined&&v!==false);if(!itens.length)return "";return `<h3>Dados do serviço</h3>${itens.map(([k,v])=>linha(k,Array.isArray(v)?v.join(", "):v===true?"Sim":v)).join("")}`;}
function abrirFicha(html){let modal=document.getElementById("detailModal");if(!modal){modal=document.createElement("div");modal.id="detailModal";modal.className="detail-modal";modal.innerHTML='<div class="detail-sheet"><button class="detail-close" onclick="fecharFicha()">×</button><div id="detailContent"></div></div>';document.body.appendChild(modal);}document.getElementById("detailContent").innerHTML=html;modal.classList.add("open");document.body.style.overflow="hidden";}
function fecharFicha(){const m=document.getElementById("detailModal");if(m)m.classList.remove("open");document.body.style.overflow="";}

function verDetalhe(tipo,i){
 const x=cloudHistorico[tipo][i];if(!x)return;
 if(tipo==="manut"){
  abrirFicha(`<div class="detail-head"><small>REGISTRO DE MANUTENÇÃO</small><h2>${esc(x.codigo||"Equipamento")}</h2><p>${esc(nomeTipoManut(x.tipo))}</p></div>
  <h3>Identificação</h3>${linha("Cliente",x.cliente)}${linha("Unidade",x.unidade)}${linha("Município",x.municipio)}${linha("Localização",x.localizacao)}${linha("Data",formatarDataHistorico(x.data||x.created_at))}${linha("Responsável técnico",x.tecnico)}
  ${camposHtml(x.campos)}<h3>Checklist</h3>${checklistHtml(x.checks)}<h3>Observações / recomendações</h3><div class="detail-note">${esc(x.observacoes||"Sem observações registradas.")}</div><h3>Registro fotográfico</h3>${fotosManut(x)}`);return;
 }
 let html=`<div class="detail-head"><h2>${esc(x.codigo||"Registro")}</h2></div>${linha("Cliente",x.cliente)}${linha("Unidade",x.unidade)}${linha("Data",formatarDataHistorico(x.data||x.created_at))}`;
 if(tipo==="analises")html+=linha("Responsável",x.responsavel)+linha("Ponto",x.ponto)+linha("pH",x.ph)+linha("Temperatura",x.temperatura!=null?x.temperatura+" °C":"")+linha("Aspecto",x.aspecto)+linha("Odor",x.odor)+linha("DBO",x.dbo)+linha("DQO",x.dqo)+linha("Sólidos",x.solidos)+linha("Óleos e graxas",x.oleos)+linha("Outros parâmetros",x.outros_param)+linha("Observações",x.observacoes);
 else html+=linha("Município",x.municipio)+linha("Tipo",x.tipo)+linha("Modelo",x.modelo)+linha("Capacidade",x.capacidade)+linha("Localização",x.localizacao)+linha("Observações",x.observacoes);
 abrirFicha(html);
}
function verDetalheLocal(tipo,i){const x=(tipo==="equip"?eqs():db.get(tipo))[i];if(!x)return;abrirFicha(`<div class="detail-head"><h2>${esc(x.codigo||x.tipo||"Registro")}</h2><p>Cópia salva neste aparelho</p></div>${linha("Cliente",x.cliente)}${linha("Unidade",x.unidade)}${linha("Data",formatarDataHistorico(x.data||x.criado||x.created_at))}${linha("Responsável técnico",x.tecnico||x.responsavel)}${linha("Observações",x.observacoes)}`);}
