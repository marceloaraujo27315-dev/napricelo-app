// Napricelo Campo - aviso de nova versao e atualizacao controlada
(function(){
  if(!('serviceWorker' in navigator))return;

  let refreshing=false;
  let registrationAtual=null;

  function criarAviso(worker){
    if(!worker||document.getElementById('napUpdateBanner'))return;
    const box=document.createElement('div');
    box.id='napUpdateBanner';
    box.style.cssText='position:fixed;left:12px;right:12px;bottom:78px;z-index:99999;background:#fff;border:1px solid #176b45;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.18);padding:14px;font-family:Arial,sans-serif;color:#173b2c';
    box.innerHTML='<div style="font-weight:700;margin-bottom:6px">Nova versão disponível</div><div style="font-size:13px;line-height:1.35;margin-bottom:10px">Há uma atualização do Napricelo Campo pronta para instalar.</div><div style="display:flex;gap:8px;flex-wrap:wrap"><button id="napUpdateNow" type="button" style="background:#176b45;color:#fff;border:0;border-radius:8px;padding:10px 14px;font-weight:700;cursor:pointer">Atualizar agora</button><button id="napUpdateLater" type="button" style="background:#eef4f0;color:#176b45;border:1px solid #cbd9d1;border-radius:8px;padding:10px 14px;font-weight:700;cursor:pointer">Depois</button></div>';
    document.body.appendChild(box);
    box.querySelector('#napUpdateNow').onclick=()=>{
      const btn=box.querySelector('#napUpdateNow');
      btn.disabled=true;btn.textContent='Atualizando...';
      worker.postMessage({type:'SKIP_WAITING'});
    };
    box.querySelector('#napUpdateLater').onclick=()=>box.remove();
  }

  function acompanhar(reg){
    registrationAtual=reg;
    if(reg.waiting)criarAviso(reg.waiting);
    reg.addEventListener('updatefound',()=>{
      const nw=reg.installing;if(!nw)return;
      nw.addEventListener('statechange',()=>{
        if(nw.state==='installed'&&navigator.serviceWorker.controller)criarAviso(nw);
      });
    });
  }

  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(refreshing)return;
    refreshing=true;
    location.reload();
  });

  navigator.serviceWorker.ready.then(reg=>{
    acompanhar(reg);
    reg.update().catch(()=>{});
    setInterval(()=>reg.update().catch(()=>{}),30*60*1000);
  }).catch(()=>{});

  window.addEventListener('focus',()=>registrationAtual?.update().catch(()=>{}));
})();
