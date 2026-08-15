let cloudHistorico={equip:[],manut:[],analises:[]};

async function buscarHistoricoNuvem(tipo){
  const tabela=tipo==="equip"?"equipamentos":tipo==="manut"?"manutencoes":"analises";
  const ordem=tipo==="equip"?"id.asc":"created_at.desc";
  const r=await fetch(`${SUPABASE_URL}/rest/v1/${tabela}?select=*&order=${ordem}`,{headers:SUPABASE_HEADERS});
  if(!r.ok)throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  const dados=await r.json();
  cloudHistorico[tipo]=dados;
  if(tipo==="equip"){
    equipCache=dados;
    db.set("equip",dados);
    refreshEquipSelectors();
  }else{
    db.set(tipo,dados);
  }
  return dados;
}

function formatarDataHistorico(v){
  if(!v)return "";
  if(/^\d{4}-\d{2}-\d{2}$/.test(v)){
    const [a,m,d]=v.split("-");return `${d}/${m}/${a}`;
  }
  const dt=new Date(v);
  return Number.isNaN(dt.getTime())?v:dt.toLocaleString("pt-BR");
}

async function renderHistorico(tipo){
  const el=$("#listaHistorico");
  el.innerHTML="<p>Carregando registros da nuvem...</p>";
  try{
    const a=await buscarHistoricoNuvem(tipo);
    if(!a.length){el.innerHTML="<p>Nenhum registro salvo na nuvem ainda.</p>";return;}
    el.innerHTML=a.map((x,i)=>{
      let extra="";
      if(tipo==="analises")extra=`<small>pH: ${x.ph??"-"} • Temp.: ${x.temperatura??"-"} °C • ${x.ponto||""}</small>`;
      if(tipo==="manut")extra=`<small>${nomeTipoManut(x.tipo)}${x.tecnico?" • "+x.tecnico:""}</small>`;
      const data=formatarDataHistorico(x.data||x.created_at);
      return `<div class="record"><b>${x.codigo||nomeTipoManut(x.tipo)||"Registro"}</b><small>${x.cliente||""}${x.unidade?" • "+x.unidade:""}</small><small>${data}</small>${extra}<button class="action" onclick="verDetalhe('${tipo}',${i})">Ver detalhes</button></div>`;
    }).join("");
  }catch(err){
    console.error(err);
    const local=tipo==="equip"?eqs():db.get(tipo);
    if(local.length){
      el.innerHTML='<p><b>Sem conexão.</b> Exibindo a última cópia salva neste aparelho.</p>'+local.slice().reverse().map((x,rev)=>{
        const i=local.length-1-rev;
        return `<div class="record"><b>${x.codigo||x.tipo}</b><small>${x.cliente||""}${x.unidade?" • "+x.unidade:""}</small><small>${formatarDataHistorico(x.data||x.criado||x.created_at)}</small><button class="action" onclick="verDetalheLocal('${tipo}',${i})">Ver detalhes</button></div>`;
      }).join("");
    }else el.innerHTML="<p>Não foi possível acessar o histórico online. Verifique a internet.</p>";
  }
}

function nomeTipoManut(tipo){
  return {biodigestor:"POP Biodigestor",gordura:"POP Caixa de Gordura",sao:"POP Água e Óleo"}[tipo]||tipo||"";
}

function verDetalhe(tipo,i){
  const x=cloudHistorico[tipo][i];
  if(!x)return;
  let txt=`Código: ${x.codigo||""}\nCliente: ${x.cliente||""}\nUnidade: ${x.unidade||""}\nData: ${formatarDataHistorico(x.data||x.created_at)}\n`;
  if(tipo==="analises"){
    txt+=`Responsável: ${x.responsavel||""}\nPonto: ${x.ponto||""}\npH: ${x.ph??""}\nTemperatura: ${x.temperatura??""} °C\nAspecto: ${x.aspecto||""}\nOdor: ${x.odor||""}\nDBO: ${x.dbo??""}\nDQO: ${x.dqo??""}\nSólidos: ${x.solidos??""}\nÓleos e graxas: ${x.oleos??""}\nOutros parâmetros: ${x.outros_param||""}\nObservações: ${x.observacoes||""}`;
  }else if(tipo==="equip"){
    txt+=`Município: ${x.municipio||""}\nTipo: ${x.tipo||""}\nModelo: ${x.modelo||""}\nCapacidade: ${x.capacidade||""}\nLocalização: ${x.localizacao||""}\nObservações: ${x.observacoes||""}`;
  }else{
    txt+=`Tipo: ${nomeTipoManut(x.tipo)}\nTécnico: ${x.tecnico||""}\nLocalização: ${x.localizacao||""}\n`;
    if(Array.isArray(x.checks))txt+=`Checklist: ${x.checks.filter(Boolean).length}/${x.checks.length} itens marcados\n`;
    if(x.campos&&typeof x.campos==="object")Object.entries(x.campos).forEach(([k,v])=>{if(v)txt+=`${k}: ${v}\n`;});
    txt+=`Observações: ${x.observacoes||""}`;
  }
  alert(txt);
}

function verDetalheLocal(tipo,i){
  const x=(tipo==="equip"?eqs():db.get(tipo))[i];
  if(!x)return;
  let txt=`Código: ${x.codigo||""}\nCliente: ${x.cliente||""}\nUnidade: ${x.unidade||""}\nData: ${formatarDataHistorico(x.data||x.criado||x.created_at)}\n`;
  if(tipo==="analises")txt+=`Responsável: ${x.responsavel||""}\nPonto: ${x.ponto||""}\npH: ${x.ph||""}\nTemperatura: ${x.temperatura||""} °C\nObservações: ${x.observacoes||""}`;
  else if(tipo==="equip")txt+=`Município: ${x.municipio||""}\nTipo: ${x.tipo||""}\nModelo: ${x.modelo||""}\nCapacidade: ${x.capacidade||""}\nLocalização: ${x.localizacao||x.local||""}\nObservações: ${x.observacoes||""}`;
  else txt+=`Técnico: ${x.tecnico||""}\nObservações: ${x.observacoes||""}`;
  alert(txt);
}
