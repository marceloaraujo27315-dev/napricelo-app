function agGeralHoje(){return new Date().toISOString().slice(0,10);}
function agGeralDias(data){if(!data)return null;const h=new Date(`${agGeralHoje()}T12:00:00`),d=new Date(`${String(data).slice(0,10)}T12:00:00`);return Math.round((d-h)/86400000);}
function agGeralFmt(data){if(!data)return 'Sem data';try{return new Date(`${String(data).slice(0,10)}T12:00:00`).toLocaleDateString('pt-BR');}catch{return data;}}
function agGeralStatus(data){const d=agGeralDias(data);if(d===null)return {g:'sem',t:'Sem data'};if(d<0)return {g:'atrasado',t:`Atrasado ${Math.abs(d)} dia(s)`};if(d===0)return {g:'hoje',t:'Hoje'};if(d<=7)return {g:'sete',t:`Em ${d} dia(s)`};if(d<=30)return {g:'trinta',t:`Em ${d} dia(s)`};return {g:'futuro',t:`Em ${d} dia(s)`};}
function agGeralEsc(v){return typeof escHtml==='function'?escHtml(v||''):String(v||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function agGeralEqLocal(id){return (typeof eqs==='function'?eqs():[]).find(e=>Number(e.id)===Number(id))||window.clienteFichaCache?.equip?.find(e=>Number(e.id)===Number(id));}
function abrirAnaliseAgendaGeral(id){const eq=agGeralEqLocal(id);showPage('analise');setTimeout(()=>{const s=document.getElementById('analiseEquip');if(!s)return;if(eq){const lista=typeof eqs==='function'?eqs():[];const idx=lista.findIndex(x=>Number(x.id)===Number(id));if([...s.options].some(o=>o.value===String(id)))s.value=String(id);else if(idx>=0)s.value=String(idx);s.dispatchEvent(new Event('change',{bubbles:true}));}},160);}
function abrirItemAgendaGeral(tipo,id){if(tipo==='agendamento'){if(typeof executarAgendaComercial==='function')executarAgendaComercial(id);return;}if(tipo==='manutencao'){if(typeof abrirAgendamentoManutencaoEquip==='function')abrirAgendamentoManutencaoEquip(id);return;}if(tipo==='analise'){abrirAnaliseAgendaGeral(id);}}
async function carregarAgendaGeral(){
 const box=document.getElementById('agendaGeralConteudo');if(!box)return;box.innerHTML='<p>Carregando agenda geral...</p>';
 try{
  const [ra,re]=await Promise.all([
   fetch(`${SUPABASE_URL}/rest/v1/agendamentos_servicos?select=*&status=not.in.(Concluído,Cancelado)&order=data_agendada.asc,horario.asc`,{headers:SUPABASE_HEADERS}),
   fetch(`${SUPABASE_URL}/rest/v1/equipamentos?select=*&order=proxima_manutencao.asc`,{headers:SUPABASE_HEADERS})
  ]);if(!ra.ok||!re.ok)throw new Error('Falha ao carregar agenda');
  const agendas=await ra.json(),equip=await re.json();
  const agManut=new Set(agendas.filter(a=>String(a.tipo_servico||'').toLowerCase().includes('manuten')&&a.equipamento_id).map(a=>Number(a.equipamento_id)));
  const agAnalise=new Set(agendas.filter(a=>String(a.tipo_servico||'').toLowerCase().includes('analis')&&a.equipamento_id).map(a=>Number(a.equipamento_id)));
  const itens=[];
  agendas.forEach(a=>itens.push({tipo:'agendamento',id:a.id,data:a.data_agendada,hora:a.horario,titulo:a.tipo_servico||'Serviço agendado',cliente:a.cliente,unidade:a.unidade,sub:a.local_servico||'',origem:'Agendado'}));
  equip.forEach(e=>{
   if(e.proxima_manutencao&&!agManut.has(Number(e.id)))itens.push({tipo:'manutencao',id:e.id,data:e.proxima_manutencao,titulo:'Manutenção periódica',cliente:e.cliente,unidade:e.unidade,sub:`${e.codigo||''} • ${e.tipo||''}`,origem:'Periodicidade'});
   if(e.proxima_analise&&!agAnalise.has(Number(e.id)))itens.push({tipo:'analise',id:e.id,data:e.proxima_analise,titulo:'Análise periódica',cliente:e.cliente,unidade:e.unidade,sub:`${e.codigo||''} • ${e.tipo||''}`,origem:'Periodicidade'});
  });
  itens.sort((a,b)=>String(a.data||'9999').localeCompare(String(b.data||'9999'))||String(a.hora||'').localeCompare(String(b.hora||'')));
  const grupos={atrasado:[],hoje:[],sete:[],trinta:[],futuro:[],sem:[]};itens.forEach(i=>grupos[agGeralStatus(i.data).g].push(i));
  const qA=grupos.atrasado.length,qH=grupos.hoje.length,q7=grupos.sete.length,q30=grupos.trinta.length;
  const resumo=`<div class="ag-geral-resumo"><div><b>${qA}</b><span>Atrasados</span></div><div><b>${qH}</b><span>Hoje</span></div><div><b>${q7}</b><span>7 dias</span></div><div><b>${q30}</b><span>30 dias</span></div></div>`;
  const nomes={atrasado:'Atrasados',hoje:'Hoje',sete:'Próximos 7 dias',trinta:'Próximos 30 dias',futuro:'Futuros',sem:'Sem data'};
  const ordem=['atrasado','hoje','sete','trinta','futuro','sem'];
  const render=ordem.map(g=>{const arr=grupos[g];if(!arr.length)return '';return `<section class="ag-geral-grupo"><h3>${nomes[g]} <small>${arr.length}</small></h3>${arr.map(i=>{const st=agGeralStatus(i.data);const acao=i.tipo==='agendamento'?'Abrir OS':i.tipo==='manutencao'?'Agendar manutenção':'Registrar análise';return `<div class="ag-geral-item ${g}"><div><b>${agGeralEsc(i.titulo)} • ${agGeralEsc(i.cliente||'')}</b><small>${agGeralEsc(i.unidade||'')}${i.sub?' • '+agGeralEsc(i.sub):''}</small><small>${agGeralFmt(i.data)}${i.hora?' • '+String(i.hora).slice(0,5):''} • ${agGeralEsc(st.t)} • ${agGeralEsc(i.origem)}</small></div><button onclick="abrirItemAgendaGeral('${i.tipo}',${Number(i.id)})">${acao}</button></div>`}).join('')}</section>`}).join('');
  box.innerHTML=resumo+(render||'<p>Nenhum compromisso operacional encontrado.</p>');
 }catch(e){console.error(e);box.innerHTML='<p>Não foi possível carregar a agenda geral.</p>';}
}
(function instalarAgendaGeral(){
 const main=document.querySelector('main');if(main&&!document.getElementById('agenda-geral')){const s=document.createElement('section');s.id='agenda-geral';s.className='page';s.innerHTML='<h2>Agenda Geral de Serviços</h2><p>Instalações, manutenções, análises e demais atendimentos em um único lugar.</p><div class="tabs"><button type="button" onclick="carregarAgendaGeral()">Atualizar agenda</button><button type="button" onclick="showPage(\'painel\')">Ver alertas</button></div><div id="agendaGeralConteudo"></div>';main.appendChild(s);}
 const grid=document.querySelector('#home .grid');if(grid&&!grid.querySelector('[data-agenda-geral]')){const b=document.createElement('button');b.className='card';b.dataset.agendaGeral='1';b.innerHTML='<b>AG</b><span>Agenda Geral</span>';b.onclick=()=>{showPage('agenda-geral');carregarAgendaGeral();};grid.insertBefore(b,grid.firstChild);}
 const st=document.createElement('style');st.textContent='.ag-geral-resumo{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:14px 0 20px}.ag-geral-resumo div{background:#f1f6f3;border-radius:10px;padding:12px;text-align:center}.ag-geral-resumo b{display:block;font-size:22px;color:#176b45}.ag-geral-resumo span{font-size:11px}.ag-geral-grupo h3{color:#176b45}.ag-geral-grupo h3 small{background:#edf6f1;border-radius:999px;padding:2px 7px}.ag-geral-item{display:flex;justify-content:space-between;align-items:center;gap:12px;background:#fff;border:1px solid #dfe8e3;border-left:5px solid #176b45;border-radius:9px;padding:12px;margin:8px 0}.ag-geral-item.atrasado{border-left-color:#b42318}.ag-geral-item.hoje{border-left-color:#d97706}.ag-geral-item.sete{border-left-color:#ca8a04}.ag-geral-item small{display:block;margin-top:3px;color:#617168}.ag-geral-item button{border:0;border-radius:8px;padding:9px 11px;background:#edf6f1;color:#176b45;font-weight:700;white-space:nowrap}@media(max-width:650px){.ag-geral-resumo{grid-template-columns:repeat(2,1fr)}.ag-geral-item{align-items:flex-start;flex-direction:column}}';document.head.appendChild(st);
})();