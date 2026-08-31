(()=>{
  function ehAndroidNativo(){
    try{return !!window.Capacitor?.isNativePlatform?.() && window.Capacitor.getPlatform?.()==='android'}catch(_){return false}
  }
  function pluginGeo(){return window.Capacitor?.Plugins?.Geolocation||null}
  function acharEntrada(btn){
    const proximos=[
      btn.closest('label')?.querySelector('input,textarea'),
      btn.parentElement?.querySelector('input,textarea'),
      btn.parentElement?.previousElementSibling?.matches?.('input,textarea')?btn.parentElement.previousElementSibling:null,
      btn.previousElementSibling?.matches?.('input,textarea')?btn.previousElementSibling:null
    ].filter(Boolean);
    if(proximos.length)return proximos[0];
    let n=btn.parentElement;
    for(let i=0;i<5&&n;i++,n=n.parentElement){const inp=n.querySelector?.('input[type="text"],input:not([type]),textarea');if(inp)return inp}
    return null;
  }
  function acharStatus(btn){
    const p=btn.parentElement;
    if(!p)return null;
    return p.querySelector?.('.geo-status,[data-geo-status],small,.hint,.status')||p.nextElementSibling||null;
  }
  function setStatus(el,txt){if(el&&'textContent' in el)el.textContent=txt}
  function inserir(input,lat,lon,acc){
    if(!input)return;
    const base=String(input.value||'').replace(/\s*\|?\s*Coordenadas:\s*-?\d+[.,]\d+\s*,\s*-?\d+[.,]\d+(?:\s*\(precisão[^)]*\))?/i,'').trim();
    const coord=`Coordenadas: ${lat.toFixed(6)}, ${lon.toFixed(6)}${Number.isFinite(acc)?` (precisão ±${Math.round(acc)} m)`:''}`;
    input.value=base?`${base} | ${coord}`:coord;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }
  async function obter(btn){
    const geo=pluginGeo();
    if(!geo)throw new Error('Geolocalização nativa não carregada.');
    const input=acharEntrada(btn),status=acharStatus(btn),texto=btn.textContent;
    btn.disabled=true;btn.textContent='Obtendo localização...';setStatus(status,'Solicitando permissão de localização do Android...');
    try{
      let perm=await geo.checkPermissions();
      if(perm.location!=='granted'&&perm.coarseLocation!=='granted')perm=await geo.requestPermissions({permissions:['location','coarseLocation']});
      if(perm.location!=='granted'&&perm.coarseLocation!=='granted')throw new Error('Permissão de localização negada. Abra Configurações > Aplicativos > Napricelo Campo > Permissões > Localização e permita durante o uso.');
      const p=await geo.getCurrentPosition({enableHighAccuracy:true,timeout:20000,maximumAge:10000});
      const c=p.coords;inserir(input,c.latitude,c.longitude,c.accuracy);
      setStatus(status,`Localização capturada: ${c.latitude.toFixed(6)}, ${c.longitude.toFixed(6)}${Number.isFinite(c.accuracy)?` (±${Math.round(c.accuracy)} m)`:''}.`);
    }finally{btn.disabled=false;btn.textContent=texto||'Usar localização atual'}
  }
  document.addEventListener('click',e=>{
    if(!ehAndroidNativo())return;
    const btn=e.target?.closest?.('button');if(!btn)return;
    if(!/localiza[cç][aã]o atual/i.test(btn.textContent||''))return;
    e.preventDefault();e.stopImmediatePropagation();
    obter(btn).catch(err=>{console.error('Falha na localização nativa',err);alert(err.message||'Não foi possível obter a localização.');});
  },true);
})();
