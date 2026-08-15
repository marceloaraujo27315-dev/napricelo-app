window.historicoInstalacoesCache=[];

const ROTULOS_COMPONENTES_INST={
  pre_tratamento:'Pré-tratamento / caixa de areia',
  vol_caixa_gradeada:'Caixa gradeada / pré-tratamento',
  vol_caixa_gordura:'Caixa de gordura',
  vol_equalizador:'Equalizador',
  vol_reator:'Reator / Ecobio',
  vol_filtro:'Filtro',
  vol_clorador:'Inspeção / clorador',
  destino_final:'Destino final'
};

async function buscarInstalacoes(filtro=''){
  const sufixo=filtro?`&${filtro}`:'';
  const r=await fetch(`${SUPABASE_URL}/rest/v1/instalacoes?select=*&order=data.desc,created_at.desc${sufixo}`,{headers:SUPABASE_HEADERS});
  if(!r.ok)throw new Error(await r.text());
  return r.json();
}

async function renderHistoricoInstalacoes(){
  const el=document.getElementById('listaHistorico');if(!el)return;
  el.innerHTML='<p>Carregando instalações da nuvem...</p>';
  try{
    const a=await buscarInstalacoes();window.historicoInstalacoesCache=a;
    if(!a.length){el.innerHTML='<p>Nenhuma instalação registrada ainda.</p>';return;}
    el.innerHTML=a.map((x,i)=>`<div class="record"><b>${esc(x.produto||'Instalação')}</b><small>${esc(x.cliente||'')}${x.unidade?' • '+esc(x.unidade):''}</small><small>${esc(x.volume||'')}${x.local_instalacao?' • '+esc(x.local_instalacao):''}</small><small>${formatarDataHistorico(x.data||x.created_at)}${x.responsavel_tecnico?' • '+esc(x.responsavel_tecnico):''}</small><button class="action" onclick="verInstalacaoHistorico(${i})">Ver POP</button></div>`).join('');
  }catch(err){console.error(err);el.innerHTML='<p>Não foi possível carregar o histórico de instalações.</p>';}
}

function componentesInstalacaoHtml(x){const a=Array.isArray(x.componentes)?x.componentes:[];if(!a.length)return '';return `<h3>Componentes / volumes do sistema</h3>${a.map(c=>linha(ROTULOS_COMPONENTES_INST[c.campo]||c.campo,c.valor)).join('')}`;}
function checklistInstalacaoHtml(x){const a=Array.isArray(x.checklist)?x.checklist:[];if(!a.length)return '<p class="muted">Checklist não informado.</p>';return `<div class="check-detail">${a.map(c=>`<div class="${c.ok?'done':'pending'}">${c.ok?'✓':'○'} ${esc(c.item||'Item')}</div>`).join('')}</div>`;}
function fotosInstalacaoHtml(x){const fotos=[['Antes',x.foto_antes],['Durante',x.foto_durante],['Depois',x.foto_depois]].filter(f=>f[1]);if(!fotos.length)return '<p class="muted">Nenhuma foto registrada nesta instalação.</p>';return `<div class="photo-grid">${fotos.map(([n,u])=>`<figure><img src="${esc(u)}" alt="Foto ${esc(n)}"><figcaption>${esc(n)}</figcaption></figure>`).join('')}</div>`;}
function conteudoInstalacao(x,comBotao=true){const rt=responsavelTecnico(x.responsavel_tecnico);return `<div class="detail-head"><small>POP DE INSTALAÇÃO</small><h2>${esc(x.produto||'Sistema ambiental')}</h2><p>${esc(x.volume||'')}</p></div><h3>Identificação</h3>${linha('Cliente / empreendimento',x.cliente)}${linha('Unidade / propriedade',x.unidade)}${linha('Município',x.municipio)}${linha('Data da instalação',formatarDataHistorico(x.data||x.created_at))}${linha('Responsável técnico',rt.nome)}${rt.cft?linha('Registro CFT',rt.cft):''}${linha('Local / setor',x.local_instalacao)}${linha('Origem do efluente',x.origem_efluente)}${componentesInstalacaoHtml(x)}<h3>Checklist da instalação</h3>${checklistInstalacaoHtml(x)}<h3>Observações finais</h3><div class="detail-note">${esc(x.observacoes||'Sem observações registradas.')}</div><h3>Registro fotográfico</h3>${fotosInstalacaoHtml(x)}${x.agendamento_id?`<div class="detail-note">Instalação originada do agendamento nº ${Number(x.agendamento_id)}</div>`:''}${comBotao?`<button class="report-btn" onclick="gerarRelatorioInstalacao(${Number(x.id)||0})">Gerar relatório / PDF</button>`:''}`;}
function verInstalacaoHistorico(i){const x=window.historicoInstalacoesCache[i];if(x)abrirFicha(conteudoInstalacao(x,true));}
function abrirInstalacaoPorId(id){const x=window.historicoInstalacoesCache.find(r=>Number(r.id)===Number(id));if(x)return abrirFicha(conteudoInstalacao(x,true));buscarInstalacoes(`id=eq.${Number(id)}`).then(a=>{if(a[0])abrirFicha(conteudoInstalacao(a[0],true));});}

function gerarRelatorioInstalacao(id){
  const obter=window.historicoInstalacoesCache.find(r=>Number(r.id)===Number(id));
  const gerar=x=>{
    if(!x)return alert('Registro de instalação não encontrado.');
    const rt=responsavelTecnico(x.responsavel_tecnico),corpo=conteudoInstalacao(x,false),w=window.open('','_blank');
    if(!w)return alert('O navegador bloqueou a abertura do relatório. Permita pop-ups e tente novamente.');
    const assinaturaUrl=rt.assinatura?new URL(rt.assinatura,window.location.href).href:'';
    const assinaturaHtml=assinaturaUrl?`<div class="signature-crop ${rt.lado==='direita'?'right':'left'}"><img src="${esc(assinaturaUrl)}"></div>`:`<div class="signature-fallback">${esc(rt.nome)}</div>`;
    w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>POP Instalação</title><style>@page{size:A4;margin:12mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#1d2a24;font-size:11px}.brand{display:flex;justify-content:space-between;border-bottom:4px solid #176b45;padding-bottom:10px;margin-bottom:14px}.brand strong{font-size:22px;color:#176b45}.detail-head{border-bottom:2px solid #176b45;padding-bottom:8px}.detail-head h2,h3{color:#176b45}.detail-row{display:grid;grid-template-columns:165px 1fr;gap:8px;padding:5px 0;border-bottom:1px solid #e5e9e6}.detail-note{background:#f5f7f6;padding:8px;border-radius:6px;white-space:pre-wrap}.check-detail{display:grid;gap:3px}.photo-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.photo-grid figure{margin:0;page-break-inside:avoid}.photo-grid img{width:100%;max-height:190px;object-fit:contain;border:1px solid #ddd}.photo-grid figcaption{text-align:center;font-weight:bold}.signature{text-align:center;margin-top:24px;page-break-inside:avoid}.signature-crop{width:360px;height:245px;overflow:hidden;margin:auto}.signature-crop img{width:720px}.signature-crop.right img{transform:translateX(-360px)}.signature-fallback{font-family:cursive;font-size:26px}.legal{margin-top:10px;padding:8px;background:#f5f7f6;font-size:9px}.actions button{background:#176b45;color:white;border:0;border-radius:8px;padding:10px 15px;font-weight:bold}@media print{.actions{display:none}}</style></head><body><div class="brand"><div><strong>NAPRICELO</strong><br>Soluções Ambientais</div><div><b>RELATÓRIO DE INSTALAÇÃO</b><br>INST-${Number(x.id)||''}</div></div>${corpo}<section class="signature">${assinaturaHtml}<div>${esc(rt.nome)}${rt.cft?'<br>'+esc(rt.cft):''}</div></section><div class="legal">Relatório gerado pelo sistema Napricelo Campo a partir do POP eletrônico de instalação. A identificação do responsável técnico corresponde à seleção feita no registro. Este recurso não substitui certificado digital ICP-Brasil, assinatura qualificada ou TRT quando legalmente exigidos.</div><div class="actions"><button onclick="window.print()">Imprimir / Salvar em PDF</button></div></body></html>`);w.document.close();
  };
  if(obter)gerar(obter);else buscarInstalacoes(`id=eq.${Number(id)}`).then(a=>gerar(a[0])).catch(()=>alert('Não foi possível carregar o registro.'));
}

const abrirFichaClienteAntesInstalacoes=window.abrirFichaCliente;
if(typeof abrirFichaClienteAntesInstalacoes==='function'){
  window.abrirFichaCliente=async function(clienteId,unidadeInicial){
    await abrirFichaClienteAntesInstalacoes(clienteId,unidadeInicial);
    try{
      const filtro=`cliente_id=eq.${Number(clienteId)}`+(unidadeInicial?`&unidade_id=eq.${Number(unidadeInicial)}`:'');
      const a=await buscarInstalacoes(filtro);
      const content=document.getElementById('clientProfileContent');if(!content)return;
      const stats=content.querySelector('.profile-stats');if(stats){const d=document.createElement('div');d.innerHTML=`<b>${a.length}</b><span>Instalações</span>`;stats.appendChild(d);}
      const bloco=document.createElement('section');bloco.className='profile-unit';bloco.innerHTML=`<div class="profile-unit-head"><div><h3>Instalações realizadas</h3><small>POPs de instalação vinculados a este cliente</small></div><span>${a.length} registro(s)</span></div>${a.length?a.slice(0,20).map(x=>`<button class="agenda-item em-dia" onclick="abrirInstalacaoCliente(${Number(x.id)},${Number(clienteId)})"><div><b>${escHtml(x.produto||'Instalação')}</b><span>${escHtml(x.unidade||'Sem unidade')}</span><small>${escHtml(x.volume||'')}${x.local_instalacao?' • '+escHtml(x.local_instalacao):''}</small></div><div class="agenda-data"><b>${fmtData(x.data||x.created_at)}</b><span>${escHtml(x.responsavel_tecnico||'')}</span></div></button>`).join(''):'<p class="muted">Nenhuma instalação registrada.</p>'}`;
      content.appendChild(bloco);
      window._instalacoesClienteAtual=a;
    }catch(err){console.warn('Histórico de instalações do cliente indisponível.',err);}
  };
}
function abrirInstalacaoCliente(id){const x=(window._instalacoesClienteAtual||[]).find(r=>Number(r.id)===Number(id));if(x)abrirFicha(conteudoInstalacao(x,true));else abrirInstalacaoPorId(id);}

(function carregarExtensoesComerciais(){['cliente-ie.js','comercial.js'].forEach(src=>{if(document.querySelector(`script[src="${src}"]`))return;const s=document.createElement('script');s.src=src+'?v=1';document.body.appendChild(s);});})();