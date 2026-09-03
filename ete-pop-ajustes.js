(function(){
'use strict';

function textoGenerico(root=document){
  root.querySelectorAll('h1,h2,h3,p,small').forEach(el=>{
    if(el.childElementCount) return;
    const t=(el.textContent||'').trim();
    if(t==='ETE Prodoeste') el.textContent='POP ETE';
    else if(t==='Histórico da ETE Prodoeste') el.textContent='Histórico do POP ETE';
    else if(t.includes('— ETE Prodoeste')) el.textContent=t.replace('— ETE Prodoeste','— POP ETE');
    else if(t==='Documento oficial de operação, inspeção e manutenção da ETE Prodoeste. O acesso é protegido e exige login.') el.textContent='Documento oficial de operação, inspeção e manutenção da ETE. O acesso é protegido e exige login.';
  });
  root.querySelectorAll('textarea[name^="leitura_"]').forEach(el=>{
    el.placeholder='Leitura, medição ou observação (opcional; registre alterações quando houver)';
  });
  const geral=root.querySelector('input[name="foto_geral"]')?.closest('.photo');
  const nc=root.querySelector('input[name="foto_nc"]')?.closest('.photo');
  const acao=root.querySelector('input[name="foto_acao"]')?.closest('.photo');
  if(geral) geral.firstChild.textContent='Condição geral (recomendada)';
  if(nc) nc.firstChild.textContent='Ponto crítico / NC (somente se houver)';
  if(acao) acao.firstChild.textContent='Ação executada (somente se houver)';
}

function condicao(resultado,nc){
  const r=String(resultado||'').toUpperCase();
  const n=Number(nc||0);
  if(r.includes('INTERDITADO')||r.includes('ESCALADO')) return 'NÃO SATISFATÓRIA – NECESSITA INTERVENÇÃO';
  if(n>0||r.includes('COM AÇÃO')) return 'SATISFATÓRIA COM AÇÕES CORRETIVAS';
  return 'SATISFATÓRIA';
}

function limparFotosSemNC(form){
  const n=Number(form?.elements?.total_nc?.value||0);
  if(n!==0) return;
  ['foto_nc','foto_acao'].forEach(nome=>{const input=form.elements?.[nome];if(input) input.value='';});
}

document.addEventListener('submit',e=>{
  if(e.target?.id==='eteChecklistForm') limparFotosSemNC(e.target);
},true);

function prepararRelatorio(w){
  if(!w) return;
  let tentativas=0;
  const timer=setInterval(()=>{
    tentativas++;
    try{
      const d=w.document;
      if(!d||!d.body){if(tentativas>20)clearInterval(timer);return;}
      const titulo=d.querySelector('.title');
      if(titulo) titulo.textContent=(titulo.textContent||'').replace('— ETE Prodoeste','— POP ETE');
      if(d.title) d.title=d.title.replace('Relatório ETE Prodoeste','Relatório Operacional da ETE');

      const rows=[...d.querySelectorAll('.row')];
      const resultadoRow=rows.find(r=>(r.querySelector('b')?.textContent||'').trim()==='Resultado');
      const ncRow=rows.find(r=>(r.querySelector('b')?.textContent||'').trim()==='Não conformidades');
      const resultado=resultadoRow?.querySelector('span')?.textContent||'';
      const nc=ncRow?.querySelector('span')?.textContent||'0';
      if(resultadoRow&&!d.querySelector('[data-condicao-operacional]')){
        const row=d.createElement('div');row.className='row';row.dataset.condicaoOperacional='1';
        row.innerHTML='<b>Condição operacional</b><span>'+condicao(resultado,nc)+'</span>';
        resultadoRow.insertAdjacentElement('afterend',row);
      }

      if(Number(nc||0)===0){
        d.querySelectorAll('.photos figure').forEach(fig=>{
          const cap=(fig.querySelector('figcaption')?.textContent||'').toLowerCase();
          if(cap.includes('ponto crítico')||cap.includes('acao executada')||cap.includes('ação executada')) fig.remove();
        });
        const hFotos=[...d.querySelectorAll('h2')].find(h=>(h.textContent||'').trim()==='Registro fotográfico');
        if(hFotos&&!d.querySelector('[data-sem-nc-foto]')){
          const p=d.createElement('p');p.dataset.semNcFoto='1';p.className='sub';
          p.textContent='Não houve não conformidade com registro fotográfico nesta inspeção.';
          hFotos.insertAdjacentElement('afterend',p);
        }
      }

      const foot=d.querySelector('.foot');
      if(foot&&!d.querySelector('[data-rastreabilidade]')){
        const p=d.createElement('p');p.dataset.rastreabilidade='1';p.style.cssText='font-size:9px;color:#68776f;margin:8px 0 0;text-align:center';
        p.textContent='Registro eletrônico de inspeção operacional emitido pelo sistema Napricelo Campo.';
        foot.insertAdjacentElement('beforebegin',p);
      }
      if(titulo&&resultadoRow){clearInterval(timer);}
    }catch(_){if(tentativas>20)clearInterval(timer);}
  },80);
}

function armarRelatorio(){
  const original=window.open;
  if(original.__eteAjustado) return;
  function temporario(){
    const w=original.apply(window,arguments);
    prepararRelatorio(w);
    setTimeout(()=>{if(window.open===temporario)window.open=original;},1200);
    return w;
  }
  temporario.__eteAjustado=true;
  window.open=temporario;
}

document.addEventListener('click',e=>{
  if(e.target.closest('[data-ete-pdf],.report-btn')) armarRelatorio();
},true);

const obs=new MutationObserver(()=>textoGenerico(document));
function iniciar(){textoGenerico(document);obs.observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();
})();
