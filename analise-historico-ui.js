(function(){
function escAH(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function linksAnalise(a){
 const obs=String(a.observacoes||'');
 const foto=a.foto_url||(obs.match(/(?:^|\n)Foto:\s*(https?:\/\/\S+)/i)||[])[1]||null;
 const laudo=a.laudo_url||(obs.match(/(?:^|\n)Laudo:\s*(https?:\/\/\S+)/i)||[])[1]||null;
 const limpa=obs.replace(/(?:^|\n)Foto:\s*https?:\/\/\S+/ig,'').replace(/(?:^|\n)Laudo:\s*https?:\/\/\S+/ig,'').trim();
 return {foto,laudo,limpa};
}
function dataIso(v){if(!v)return '';return String(v).slice(0,10);}
async function organizarHistoricoAnalises(id){
 const host=document.getElementById('equipCentralExtra');if(!host)return;
 try{
  const r=await fetch(`${SUPABASE_URL}/rest/v1/analises?select=*&equipamento_id=eq.${Number(id)}&order=created_at.desc`,{headers:SUPABASE_HEADERS});
  if(!r.ok)return;
  const analises=await r.json();
  const cards=[...host.querySelectorAll('.equip-time-item.analise')];
  cards.forEach((card,i)=>{
   const a=analises[i]||analises.find(x=>{const d=card.querySelector('.equip-time-date')?.textContent||'';const [dd,mm,aa]=d.split('/');return dataIso(x.data||x.created_at)===`${aa}-${mm}-${dd}`;});
   if(!a)return;
   const l=linksAnalise(a),body=card.querySelector('.equip-time-body');if(!body)return;
   const span=body.querySelector('span');if(span)span.textContent=a.ponto?`Ponto de coleta: ${a.ponto}`:(a.tipo_analise||'Coleta / Análise');
   let small=body.querySelector('small');const resumo=[a.responsavel?`Responsável: ${a.responsavel}`:'',l.limpa].filter(Boolean).join(' • ');
   if(resumo){if(!small){small=document.createElement('small');body.appendChild(small);}small.textContent=resumo;}else if(small)small.remove();
   let ac=body.querySelector('.analise-time-actions');if(!ac){ac=document.createElement('div');ac.className='equip-time-actions analise-time-actions';body.appendChild(ac);}
   ac.innerHTML=`<button type="button" class="analise-detalhes">Ver detalhes</button>${l.foto?`<button type="button" data-url="${escAH(l.foto)}">Foto</button>`:''}${l.laudo?`<button type="button" data-url="${escAH(l.laudo)}">Laudo</button>`:''}<button type="button" class="analise-pdf">PDF</button>`;
   ac.querySelector('.analise-detalhes').onclick=()=>mostrarDetalhesAnalise(a,l);
   ac.querySelector('.analise-pdf').onclick=()=>typeof imprimirAnaliseAmbiental==='function'&&imprimirAnaliseAmbiental({...a,observacoes:l.limpa});
   ac.querySelectorAll('[data-url]').forEach(b=>b.onclick=()=>window.open(b.dataset.url,'_blank','noopener'));
  });
 }catch(e){console.warn('Não foi possível organizar os anexos das análises no histórico.',e);}
}
window.mostrarDetalhesAnalise=function(a,l){
 let m=document.getElementById('analiseDetailModal');if(!m){m=document.createElement('div');m.id='analiseDetailModal';m.className='detail-modal';m.innerHTML='<div class="detail-sheet"><button class="detail-close">×</button><div id="analiseDetailContent"></div></div>';document.body.appendChild(m);m.querySelector('.detail-close').onclick=()=>m.classList.remove('open');}
 const p=(rot,v,un='')=>v!==null&&v!==undefined&&v!==''?`<div><b>${rot}</b><span>${escAH(v)}${un}</span></div>`:'';
 document.getElementById('analiseDetailContent').innerHTML=`<div class="detail-head"><small>COLETA / ANÁLISE</small><h2>${escAH(a.codigo||'Análise')}</h2><p>${escAH(a.data||'')}</p></div><div class="profile-info-grid">${p('Ponto de coleta',a.ponto)}${p('Responsável',a.responsavel)}${p('pH',a.ph)}${p('Temperatura',a.temperatura,' °C')}${p('DBO',a.dbo,' mg/L')}${p('DQO',a.dqo,' mg/L')}${p('Sólidos sedimentáveis',a.solidos,' mL/L')}${p('Óleos e graxas',a.oleos,' mg/L')}${p('Aspecto',a.aspecto)}${p('Odor',a.odor)}</div>${a.outros_param?`<h3>Parâmetros complementares</h3><div class="detail-note">${escAH(a.outros_param).replace(/\n/g,'<br>')}</div>`:''}${l.limpa?`<h3>Observações</h3><div class="detail-note">${escAH(l.limpa)}</div>`:''}<div class="equip-doc-actions">${l.foto?`<button onclick="window.open('${escAH(l.foto)}','_blank','noopener')">Abrir foto</button>`:''}${l.laudo?`<button onclick="window.open('${escAH(l.laudo)}','_blank','noopener')">Abrir laudo</button>`:''}<button id="analiseDetailPdf">Imprimir / PDF</button></div>`;
 document.getElementById('analiseDetailPdf').onclick=()=>imprimirAnaliseAmbiental({...a,observacoes:l.limpa});m.classList.add('open');
};
const base=window.abrirFichaEquipamento;if(typeof base==='function')window.abrirFichaEquipamento=function(id){const r=base.apply(this,arguments);setTimeout(()=>organizarHistoricoAnalises(id),450);return r;};
})();