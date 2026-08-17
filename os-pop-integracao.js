(function(){
function equipamentosDaOS(a){
  const lista=typeof eqs==='function'?eqs():[];
  return lista.filter(e=>Number(e.cliente_id)===Number(a.cliente_id)&&(a.unidade_id?Number(e.unidade_id)===Number(a.unidade_id):true));
}
function abrirPopOS(a,e){
  if(!e)return;
  try{sessionStorage.setItem('napricelo_os_pop',JSON.stringify({agenda_id:Number(a.id),equipamento_id:Number(e.id),os:`OS-${String(a.id).padStart(5,'0')}`,tipo:e.tipo||'',codigo:e.codigo||''}));}catch(_){ }
  if(typeof fecharFicha==='function')fecharFicha();
  if(typeof fecharFichaEquipamento==='function')fecharFichaEquipamento();
  if(typeof iniciarManutencaoEquip==='function'){
    iniciarManutencaoEquip(e.id);
    setTimeout(()=>{
      const page=typeof tipoPaginaManut==='function'?tipoPaginaManut(e.tipo):'biodigestor';
      const raiz=document.getElementById(page);if(!raiz)return;
      let aviso=raiz.querySelector('.os-pop-vinculo');
      if(!aviso){aviso=document.createElement('div');aviso.className='os-pop-vinculo';const pop=raiz.querySelector('.pop')||raiz;pop.insertBefore(aviso,pop.firstChild);}
      aviso.innerHTML=`<b>Execução vinculada à OS-${String(a.id).padStart(5,'0')}</b><span>${escHtml(e.codigo||'Equipamento')} • ${escHtml(e.tipo||'')}</span>`;
      aviso.scrollIntoView({behavior:'smooth',block:'start'});
    },220);
  }
}
function escolherEquipamentoOS(a,lista){
  const itens=lista.map(e=>`<button type="button" class="os-pop-equip" onclick="window.__abrirPopOS(${Number(a.id)},${Number(e.id)})"><b>${escHtml(e.codigo||'Sem código')}</b><span>${escHtml(e.tipo||'Equipamento')}${e.capacidade?' • '+escHtml(e.capacidade):''}</span><small>${escHtml(e.localizacao||'')}</small></button>`).join('');
  abrirFicha(`<div class="detail-head"><small>ORDEM DE SERVIÇO</small><h2>Selecionar equipamento</h2><p>Escolha o equipamento que será atendido nesta OS.</p></div><div class="os-pop-lista">${itens}</div>`);
}
window.__abrirPopOS=function(agendaId,equipId){const a=(agendaComercialCache||[]).find(x=>Number(x.id)===Number(agendaId));const e=(typeof eqs==='function'?eqs():[]).find(x=>Number(x.id)===Number(equipId));if(a&&e)abrirPopOS(a,e);};
const base=window.iniciarServicoDaOS;
window.iniciarServicoDaOS=async function(id){
  const a=(agendaComercialCache||[]).find(x=>Number(x.id)===Number(id));
  if(!a)return base?base.apply(this,arguments):undefined;
  const tipo=String(a.tipo_servico||'').toLowerCase();
  if(!tipo.includes('manuten'))return base?base.apply(this,arguments):undefined;
  const lista=equipamentosDaOS(a);
  if(!lista.length){alert('Nenhum equipamento cadastrado foi encontrado para este cliente/unidade. Cadastre ou vincule o equipamento antes de iniciar o POP.');return;}
  if(lista.length===1){abrirPopOS(a,lista[0]);return;}
  escolherEquipamentoOS(a,lista);
};
const st=document.createElement('style');st.textContent='.os-pop-vinculo{background:#eaf5ef;border-left:5px solid #176b45;border-radius:10px;padding:12px 14px;margin:0 0 14px;display:flex;flex-direction:column;gap:3px}.os-pop-vinculo b{color:#176b45}.os-pop-vinculo span{font-size:13px}.os-pop-lista{display:grid;gap:9px}.os-pop-equip{width:100%;text-align:left;border:1px solid #cfe0d7;background:#fff;border-radius:10px;padding:12px;color:#25372d}.os-pop-equip b,.os-pop-equip span,.os-pop-equip small{display:block}.os-pop-equip b{color:#176b45;font-size:16px}.os-pop-equip span{margin-top:3px}.os-pop-equip small{margin-top:4px;color:#65766d}';document.head.appendChild(st);
})();