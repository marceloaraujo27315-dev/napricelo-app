function statusPeriodicidadeAnalise(eq){
  if(!eq?.periodicidade_analise_meses)return {classe:'sem-periodo',texto:'Periodicidade de análise não definida'};
  if(!eq.proxima_analise)return {classe:'sem-data',texto:`Análise a cada ${eq.periodicidade_analise_meses} mês(es)`};
  const hoje=new Date();hoje.setHours(0,0,0,0);
  const prox=new Date(`${String(eq.proxima_analise).slice(0,10)}T12:00:00`);
  const dias=Math.ceil((prox-hoje)/86400000);
  if(dias<0)return {classe:'vencida',texto:`Análise vencida há ${Math.abs(dias)} dia(s)`};
  if(dias<=30)return {classe:'proxima',texto:`Análise vence em ${dias} dia(s)`};
  return {classe:'em-dia',texto:`Análise em dia • vence em ${dias} dia(s)`};
}
function pedirDataBaseAnalise(eq){
  const atual=eq.data_base_analise?fmtPeriodoData(eq.data_base_analise):'';
  const v=prompt('Data da última análise conhecida (DD/MM/AAAA):',atual);
  if(v===null)return undefined;
  const s=String(v).trim();if(!s)return null;
  const m=s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);if(!m){alert('Use o formato DD/MM/AAAA.');return pedirDataBaseAnalise(eq);}
  const iso=`${m[3]}-${m[2]}-${m[1]}`;const d=new Date(`${iso}T12:00:00`);
  if(Number.isNaN(d.getTime())){alert('Data inválida.');return pedirDataBaseAnalise(eq);}
  return iso;
}
async function atualizarPeriodicidadeAnalise(id,meses,ultimaData,dataBase){
  const base=ultimaData||dataBase||null;
  const proxima=base&&meses?addMesesData(base,meses):null;
  const payload={periodicidade_analise_meses:meses?Number(meses):null,proxima_analise:proxima,data_base_analise:ultimaData?null:(dataBase||null)};
  const r=await fetch(`${SUPABASE_URL}/rest/v1/equipamentos?id=eq.${Number(id)}`,{method:'PATCH',headers:{...SUPABASE_HEADERS,Prefer:'return=representation'},body:JSON.stringify(payload)});
  if(!r.ok)throw new Error(await r.text());
  const atualizado=(await r.json())[0];
  const i=equipCache.findIndex(e=>Number(e.id)===Number(id));if(i>=0)equipCache[i]={...equipCache[i],...atualizado};
  db.set('equip',equipCache);
  if(window.clienteFichaCache?.equip){const j=clienteFichaCache.equip.findIndex(e=>Number(e.id)===Number(id));if(j>=0)clienteFichaCache.equip[j]={...clienteFichaCache.equip[j],...atualizado};}
  return atualizado;
}
async function definirPeriodicidadeAnalise(id){
  const eq=eqs().find(e=>Number(e.id)===Number(id))||window.clienteFichaCache?.equip?.find(e=>Number(e.id)===Number(id));if(!eq)return;
  const valor=prompt('Periodicidade da análise em meses (ex.: 1, 3, 6, 12):',String(eq.periodicidade_analise_meses||6));if(valor===null)return;
  const meses=Number(valor);if(!Number.isInteger(meses)||meses<1||meses>60)return alert('Informe um número inteiro entre 1 e 60 meses.');
  let ultima=null;
  if(window.clienteFichaCache?.analises)ultima=clienteFichaCache.analises.filter(a=>Number(a.equipamento_id)===Number(id)).sort((a,b)=>new Date(b.data||b.created_at)-new Date(a.data||a.created_at))[0];
  if(!ultima){try{const r=await fetch(`${SUPABASE_URL}/rest/v1/analises?equipamento_id=eq.${Number(id)}&select=*&order=data.desc.nullslast,created_at.desc&limit=1`,{headers:SUPABASE_HEADERS});if(r.ok)ultima=(await r.json())[0];}catch(_){}}
  let dataBase=eq.data_base_analise||null;
  if(!ultima){const pedida=pedirDataBaseAnalise(eq);if(pedida===undefined)return;dataBase=pedida;}
  try{await atualizarPeriodicidadeAnalise(id,meses,ultima?.data||ultima?.created_at||null,dataBase);alert('Periodicidade da análise atualizada.');if(typeof abrirFichaEquipamento==='function')abrirFichaEquipamento(id);}catch(err){console.error(err);alert('Não foi possível atualizar a periodicidade da análise.');}
}
(function inserirCamposAnaliseNoCadastro(){
  const form=document.getElementById('equipForm');if(!form||form.querySelector('[name="periodicidade_analise_meses"]'))return;
  const origem=form.querySelector('[name="origem"]')?.closest('label');
  const bloco=document.createElement('div');
  bloco.innerHTML='<label>Periodicidade da análise<select name="periodicidade_analise_meses"><option value="">Não definida</option><option value="1">Mensal</option><option value="3">A cada 3 meses</option><option value="6">Semestral (6 meses)</option><option value="12">Anual (12 meses)</option></select></label><label>Última análise conhecida (opcional)<input name="data_base_analise" type="date"></label>';
  while(bloco.firstChild){if(origem)form.insertBefore(bloco.firstChild,origem);else form.appendChild(bloco.firstChild);}
})();
const salvarEquipamentoAnaliseBase=salvarEquipamentoNuvem;
salvarEquipamentoNuvem=async function(o){
  const salvo=await salvarEquipamentoAnaliseBase(o);
  const meses=o.periodicidade_analise_meses?Number(o.periodicidade_analise_meses):null;
  const base=o.data_base_analise||null;
  if(salvo?.id&&(meses||base)){
    try{return await atualizarPeriodicidadeAnalise(salvo.id,meses,null,base);}catch(err){console.warn('Equipamento salvo, mas programação de análise não foi gravada.',err);}
  }
  return salvo;
};
const salvarAnalisePeriodicidadeBase=salvarAnaliseNuvem;
salvarAnaliseNuvem=async function(o,eq){
  const salvo=await salvarAnalisePeriodicidadeBase(o,eq);
  if(eq?.id&&eq.periodicidade_analise_meses){
    try{await atualizarPeriodicidadeAnalise(eq.id,eq.periodicidade_analise_meses,o.data||salvo.data||new Date().toISOString().slice(0,10),null);}catch(err){console.warn('Análise salva, mas próxima análise não foi atualizada.',err);}
  }
  return salvo;
};