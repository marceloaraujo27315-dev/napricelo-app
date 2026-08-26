(()=>{
 const head=document.head;
 if(!document.querySelector('link[href*="mobile-ui-v2.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='mobile-ui-v2.css?v=61';head.appendChild(l)}
 function load(src){return new Promise((res,rej)=>{if(document.querySelector(`script[src*="${src}"]`))return res();const s=document.createElement('script');s.src=src+'?v=61';s.onload=res;s.onerror=rej;document.body.appendChild(s)})}
 Promise.resolve().then(()=>load('cliente-foco-mobile.js')).then(()=>load('share-manutencao-main.js')).catch(e=>console.warn('Falha ao carregar aprimoramentos v61',e));
})();