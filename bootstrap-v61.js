(()=>{
 const head=document.head;
 if(!document.querySelector('link[href*="mobile-ui-v2.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='mobile-ui-v2.css?v=97';head.appendChild(l)}
 function load(src){return new Promise((res,rej)=>{if(document.querySelector(`script[src*="${src}"]`))return res();const s=document.createElement('script');s.src=src+'?v=97';s.onload=res;s.onerror=rej;document.body.appendChild(s)})}
 Promise.resolve().then(()=>load('cliente-foco-mobile.js')).then(()=>load('share-manutencao-main.js')).then(()=>load('share-proposta-main.js')).catch(e=>console.warn('Falha ao carregar aprimoramentos v97',e));

 function mostrarAtualizacao(reg){
   if(document.getElementById('napAtualizacaoVersao'))return;
   const box=document.createElement('div');
   box.id='napAtualizacaoVersao';
   box.style.cssText='position:fixed;left:12px;right:12px;bottom:78px;z-index:99999;background:#fff;border:1px solid #cfd9d3;border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.18);padding:14px;font-family:inherit';
   box.innerHTML='<div style="display:flex;gap:12px;align-items:center;justify-content:space-between"><div><b>Nova versão disponível</b><div style="font-size:13px;margin-top:3px;color:#56645c">Há uma atualização do Napricelo Campo pronta para instalar.</div></div><button type="button" id="napAtualizarAgora" style="border:0;border-radius:9px;padding:10px 14px;background:#176b45;color:#fff;font-weight:700;white-space:nowrap">Atualizar</button></div>';
   document.body.appendChild(box);
   box.querySelector('#napAtualizarAgora').onclick=()=>{
     const w=reg?.waiting;
     if(!w)return location.reload();
     const btn=box.querySelector('#napAtualizarAgora');btn.disabled=true;btn.textContent='Atualizando...';
     w.postMessage({type:'SKIP_WAITING'});
   };
 }

 async function configurarAtualizacao(){
   if(!('serviceWorker' in navigator))return;
   try{
     const reg=await navigator.serviceWorker.ready;
     if(reg.waiting&&navigator.serviceWorker.controller)mostrarAtualizacao(reg);
     reg.addEventListener('updatefound',()=>{
       const novo=reg.installing;if(!novo)return;
       novo.addEventListener('statechange',()=>{
         if(novo.state==='installed'&&navigator.serviceWorker.controller)mostrarAtualizacao(reg);
       });
     });
     let recarregando=false;
     navigator.serviceWorker.addEventListener('controllerchange',()=>{
       if(recarregando)return;recarregando=true;location.reload();
     });
     reg.update().catch(()=>{});
     setInterval(()=>reg.update().catch(()=>{}),30*60*1000);
   }catch(e){console.warn('Não foi possível verificar atualização do aplicativo',e);}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',configurarAtualizacao);else configurarAtualizacao();
})();