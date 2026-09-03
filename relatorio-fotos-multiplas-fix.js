(()=>{
  function arr(v){if(Array.isArray(v))return v.filter(Boolean);if(typeof v==='string'&&v.trim())return[v];return[]}
  function uniq(v){return [...new Set(v.filter(Boolean))]}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function registro(id){
    const l=window.cloudHistorico?.manut||((typeof cloudHistorico!=='undefined'&&cloudHistorico?.manut)||[]);
    return l.find(x=>String(x.id)===String(id))||null;
  }
  function grupos(x){
    return [
      {titulo:'ANTES – condição encontrada',urls:uniq([...arr(x?.foto_antes),...arr(x?.fotos_antes)])},
      {titulo:'DURANTE – execução do serviço',urls:uniq([...arr(x?.foto_durante),...arr(x?.fotos_durante)])},
      {titulo:'DEPOIS – condição após o serviço',urls:uniq([...arr(x?.foto_depois),...arr(x?.fotos_depois)])}
    ].filter(g=>g.urls.length);
  }
  function reconstruirFotos(w,x){
    if(!w?.document||!x)return;
    const gs=grupos(x);if(!gs.length)return;
    let sec=w.document.querySelector('.photos');
    if(!sec){
      const main=w.document.querySelector('.main,.page');if(!main)return;
      sec=w.document.createElement('section');sec.className='page photos';
      const cab=main.querySelector('header')?.outerHTML||'';
      const rod=main.querySelector('footer')?.outerHTML||'';
      sec.innerHTML=`${cab}<div class="secnum">10</div><h2>Registro fotográfico</h2><p class="intro">Evidências fotográficas vinculadas ao atendimento.</p>${rod}`;
      main.insertAdjacentElement('afterend',sec);
    }
    sec.querySelectorAll('figure,.foto-grupo-titulo,.foto-grid-multi').forEach(n=>n.remove());
    const footer=sec.querySelector('footer');
    gs.forEach(g=>{
      const h=w.document.createElement('h3');h.className='foto-grupo-titulo';h.textContent=`${g.titulo} (${g.urls.length} foto${g.urls.length>1?'s':''})`;
      h.style.cssText='margin:10px 0 5px;color:#176b45;font-size:12px';
      const grid=w.document.createElement('div');grid.className='foto-grid-multi';grid.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-bottom:9px';
      g.urls.forEach((u,i)=>{const f=w.document.createElement('figure');f.style.cssText='margin:0;border:1px solid #d8e2dd;padding:4px;break-inside:avoid';f.innerHTML=`<div class="pic" style="height:58mm;display:flex;align-items:center;justify-content:center"><img src="${esc(u)}" style="max-width:100%;max-height:100%;object-fit:contain"></div><figcaption style="text-align:center;font-weight:bold;color:#176b45;font-size:9px">${esc(g.titulo.split(' – ')[0])} ${i+1}</figcaption>`;grid.appendChild(f)});
      if(footer){sec.insertBefore(h,footer);sec.insertBefore(grid,footer)}else{sec.append(h,grid)}
    });
    let st=w.document.getElementById('multi-fotos-relatorio-css');if(!st){st=w.document.createElement('style');st.id='multi-fotos-relatorio-css';st.textContent='@media(max-width:700px){.foto-grid-multi{grid-template-columns:1fr!important}.foto-grid-multi .pic{height:auto!important;max-height:420px}}@media print{.foto-grid-multi{grid-template-columns:repeat(2,1fr)!important}.foto-grid-multi .pic{height:58mm!important}.foto-grupo-titulo{break-after:avoid}.foto-grid-multi figure{break-inside:avoid}}';w.document.head.appendChild(st)}
  }

  const base=window.gerarRelatorioTecnicoExecucao;
  if(typeof base==='function'&&!base.__multiFotosFix){
    const wrap=function(id){
      const abrir=window.open;let jan=null;
      window.open=function(){jan=abrir.apply(window,arguments);return jan};
      try{return base.apply(this,arguments)}finally{
        window.open=abrir;
        const x=registro(id);
        if(jan&&x){setTimeout(()=>reconstruirFotos(jan,x),180);setTimeout(()=>reconstruirFotos(jan,x),650)}
      }
    };
    wrap.__multiFotosFix=true;window.gerarRelatorioTecnicoExecucao=wrap;
  }

  function imagensHtml(x){return grupos(x).map(g=>`<div style="margin-top:10px"><b style="color:#176b45">${esc(g.titulo)} (${g.urls.length})</b><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:6px">${g.urls.map((u,i)=>`<figure style="margin:0"><img src="${esc(u)}" style="width:100%;max-height:220px;object-fit:contain;border:1px solid #d8e2dd;border-radius:6px"><figcaption style="font-size:11px;text-align:center">${esc(g.titulo.split(' – ')[0])} ${i+1}</figcaption></figure>`).join('')}</div></div>`).join('')}
  const visBase=window.visualizarExecucaoOS;
  if(typeof visBase==='function'&&!visBase.__multiFotosFix){
    const wrap=async function(){const r=await visBase.apply(this,arguments);setTimeout(()=>{
      const modal=document.querySelector('.os-resgate-modal,.modal-os,.detail-modal,.modal-content');if(!modal)return;
      const txt=modal.textContent||'';let x=null;
      const l=window.cloudHistorico?.manut||[];
      x=l.find(m=>txt.includes(String(m.codigo||'').trim())&&String(m.codigo||'').trim())||null;
      if(!x)return;const reg=modal.querySelector('[data-multi-fotos-visual]');if(reg)reg.remove();const html=imagensHtml(x);if(!html)return;const box=document.createElement('div');box.dataset.multiFotosVisual='1';box.innerHTML=`<h3 style="color:#176b45">Registro fotográfico completo</h3>${html}`;const alvo=[...modal.querySelectorAll('h3,h2')].find(n=>/registro fotográfico/i.test(n.textContent||''));(alvo?.parentElement||modal).appendChild(box);
    },180);return r};wrap.__multiFotosFix=true;window.visualizarExecucaoOS=wrap;
  }
})();
