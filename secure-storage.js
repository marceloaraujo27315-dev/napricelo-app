(()=>{
const URL_BASE='https://zhdcekhqntytiswdjqaw.supabase.co';
const API_KEY='sb_publishable_bcVp32RbgpOHOYbmjcaAPg_G4fiLDIw';
const BUCKET='manutencoes-fotos';
const AUTH_KEY='napricelo_auth_session';
const cache=new Map();
function session(){try{return JSON.parse(localStorage.getItem(AUTH_KEY)||'null')}catch{return null}}
function token(){return session()?.access_token||''}
function pathFromUrl(url){
 if(!url||typeof url!=='string')return null;
 const marks=[`/storage/v1/object/public/${BUCKET}/`,`/storage/v1/object/authenticated/${BUCKET}/`];
 for(const m of marks){const i=url.indexOf(m);if(i>=0)return decodeURIComponent(url.slice(i+m.length).split('?')[0]);}
 if(url.startsWith(`${BUCKET}/`))return url.slice(BUCKET.length+1);
 return null;
}
function isStorageUrl(url){return !!pathFromUrl(url)}
async function privateBlobUrl(url){
 const p=pathFromUrl(url);if(!p)return url;
 if(cache.has(p))return cache.get(p);
 const jwt=token();if(!jwt)throw new Error('Sessão necessária para abrir o arquivo.');
 const r=await fetch(`${URL_BASE}/storage/v1/object/authenticated/${BUCKET}/${p.split('/').map(encodeURIComponent).join('/')}`,{headers:{apikey:API_KEY,Authorization:`Bearer ${jwt}`}});
 if(!r.ok)throw new Error(`Não foi possível abrir o arquivo (${r.status}).`);
 const blob=await r.blob(),obj=URL.createObjectURL(blob);cache.set(p,obj);return obj;
}
async function applyImg(img){
 const src=img.getAttribute('src')||'';if(!isStorageUrl(src)||img.dataset.secureStorage==='1')return;
 img.dataset.secureStorage='loading';
 try{img.src=await privateBlobUrl(src);img.dataset.secureStorage='1'}catch(err){console.warn('Foto privada não carregada',err);img.dataset.secureStorage='erro'}
}
async function applyLink(a){
 const href=a.getAttribute('href')||'';if(!isStorageUrl(href)||a.dataset.secureStorage==='1')return;
 a.dataset.secureStorage='loading';
 try{a.href=await privateBlobUrl(href);a.dataset.secureStorage='1'}catch(err){console.warn('Arquivo privado não carregado',err);a.dataset.secureStorage='erro'}
}
function apply(root=document){root.querySelectorAll?.('img[src]').forEach(applyImg);root.querySelectorAll?.('a[href]').forEach(applyLink)}
function observeDoc(doc){
 try{apply(doc);const ob=new MutationObserver(ms=>{for(const m of ms){for(const n of m.addedNodes){if(n.nodeType!==1)continue;if(n.matches?.('img[src]'))applyImg(n);if(n.matches?.('a[href]'))applyLink(n);apply(n)}}});ob.observe(doc.documentElement,{childList:true,subtree:true});return ob}catch{return null}
}
observeDoc(document);
const nativeOpen=window.open.bind(window);
window.open=function(){const w=nativeOpen(...arguments);if(!w)return w;try{const d=w.document,nativeClose=d.close.bind(d);d.close=function(){const r=nativeClose();setTimeout(()=>observeDoc(w.document),0);return r;};setTimeout(()=>observeDoc(w.document),0)}catch{}return w};
window.secureStorageUrl=privateBlobUrl;
window.secureStoragePath=pathFromUrl;
window.secureStorageApply=apply;
window.napriceloAccessToken=token;
setTimeout(()=>apply(document),0);
})();