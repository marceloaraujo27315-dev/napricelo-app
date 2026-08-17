(function(){
const assinaturas={tecnico:null,cliente:null};
function css(){if(document.getElementById('osAssCss'))return;const s=document.createElement('style');s.id='osAssCss';s.textContent=`.os-ass-box{margin-top:8px;border:1px solid #cfe0d7;border-radius:12px;padding:10px;background:#f8fbf9}.os-ass-box b{display:block;color:#176b45;margin-bottom:7px}.os-ass-canvas{display:block;width:100%;height:150px;background:#fff;border:1px dashed #8fb8a3;border-radius:8px;touch-action:none}.os-ass-actions{display:flex;gap:8px;margin-top:7px}.os-ass-actions button{border:1px solid #b9d3c5;background:#fff;color:#176b45;border-radius:8px;padding:8px 11px;font-weight:700}.os-ass-ok{font-size:12px;color:#176b45;margin-top:6px;font-weight:700}`;document.head.appendChild(s)}
function montar(nome,titulo){const input=document.querySelector(`#osExecForm [name="${nome}"]`);if(!input||input.dataset.assReady)return;input.dataset.assReady='1';const tipo=nome.includes('tecnico')?'tecnico':'cliente';const box=document.createElement('div');box.className='os-ass-box';box.innerHTML=`<b>Assinatura na tela — ${titulo}</b><canvas class="os-ass-canvas" data-ass="${tipo}"></canvas><div class="os-ass-actions"><button type="button" data-limpar="${tipo}">Limpar assinatura</button></div><div class="os-ass-ok" data-ok="${tipo}">Assine com o dedo dentro do quadro.</div>`;input.parentElement.appendChild(box);const c=box.querySelector('canvas'),ctx=c.getContext('2d');let desenhando=false;
 function tamanho(){const r=c.getBoundingClientRect(),d=Math.max(1,window.devicePixelRatio||1);c.width=Math.round(r.width*d);c.height=Math.round(150*d);ctx.setTransform(d,0,0,d,0,0);ctx.lineWidth=2.2;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#17251e'}
 tamanho();
 function pos(e){const r=c.getBoundingClientRect(),p=e.touches?e.touches[0]:e;return [p.clientX-r.left,p.clientY-r.top]}
 function ini(e){e.preventDefault();desenhando=true;const [x,y]=pos(e);ctx.beginPath();ctx.moveTo(x,y)}
 function mov(e){if(!desenhando)return;e.preventDefault();const[x,y]=pos(e);ctx.lineTo(x,y);ctx.stroke()}
 function fim(){if(!desenhando)return;desenhando=false;assinaturas[tipo]=c.toDataURL('image/png');box.querySelector(`[data-ok="${tipo}"]`).textContent='✓ Assinatura registrada na tela';}
 c.addEventListener('pointerdown',ini);c.addEventListener('pointermove',mov);c.addEventListener('pointerup',fim);c.addEventListener('pointercancel',fim);c.addEventListener('pointerleave',fim);
 box.querySelector(`[data-limpar="${tipo}"]`).onclick=()=>{ctx.clearRect(0,0,c.width,c.height);assinaturas[tipo]=null;box.querySelector(`[data-ok="${tipo}"]`).textContent='Assine com o dedo dentro do quadro.'};
}
function instalar(){css();const f=document.getElementById('osExecForm');if(!f)return;montar('assinatura_tecnico','técnico');montar('assinatura_cliente','cliente / responsável local');}
window.obterAssinaturasDesenhadasOS=()=>({...assinaturas});
const o=new MutationObserver(instalar);o.observe(document.documentElement,{subtree:true,childList:true});instalar();
})();