(()=>{
  function ehAndroidNativo(){
    try{return !!window.Capacitor?.isNativePlatform?.() && window.Capacitor.getPlatform?.()==='android'}catch(_){return false}
  }
  function pluginGeo(){return window.Capacitor?.Plugins?.Geolocation||null}
  function acharEntrada(btn){
    const wrap=btn.closest('.geo-campo')||btn.parentElement;
    const anterior=wrap?.previousElementSibling;
    const proximos=[
      btn.closest('label')?.querySelector('input,textarea'),
      wrap?.querySelector?.('input,textarea'),
      anterior?.matches?.('input,textarea')?anterior:null,
      anterior?.matches?.('label')?anterior.querySelector('input,textarea'):null,
      anterior?.querySelector?.('input,textarea'),
      wrap?.parentElement?.querySelector?.('input[name="local_instalacao"],input[name="localizacao"],input[name="local"]')
    ].filter(Boolean);
    return proximos[0]||null;
  }
  function acharStatus(btn){
    const wrap=btn.closest('.geo-campo')||btn.parentElement;
    return wrap?.querySelector?.('.geo-status,[data-geo-status],small,.hint,.status')||null;
  }
  function acharMapa(btn){
    const wrap=btn.closest('.geo-campo')||btn.parentElement;
    return wrap?.querySelector?.('.geo-map-btn')||[...wrap?.querySelectorAll?.('button')||[]].find(b=>/abrir no mapa/i.test(b.textContent||''))||null;
  }
  function setStatus(el,txt){if(el&&'textContent' in el)el.textContent=txt}
  function inserir(input,lat,lon,acc){
    if(!input)throw new Error('Campo de localização não identificado.');
    const base=String(input.value||'').replace(/\s*\|?\s*Coordenadas:\s*-?\d+[.,]\d+\s*,\s*-?\d+[.,]\d+(?:\s*\(precisão[^)]*\))?/i,'').trim();
    const coord=`Coordenadas: ${lat.toFixed(6)}, ${lon.toFixed(6)}${Number.isFinite(acc)?` (precisão ±${Math.round(acc)} m)`:''}`;
    input.value=base?`${base} | ${coord}`:coord;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }
  async function obter(btn){
    const geo=pluginGeo();
    if(!geo)throw new Error('Geolocalização nativa não carregada.');
    const input=acharEntrada(btn),status=acharStatus(btn),mapBtn=acharMapa(btn),texto=btn.textContent;
    btn.disabled=true;btn.textContent='Obtendo localização...';setStatus(status,'Solicitando permissão de localização do Android...');
    try{
      let perm=await geo.checkPermissions();
      if(perm.location!=='granted'&&perm.coarseLocation!=='granted')perm=await geo.requestPermissions({permissions:['location','coarseLocation']});
      if(perm.location!=='granted'&&perm.coarseLocation!=='granted')throw new Error('Permissão de localização negada. Abra Configurações > Aplicativos > Napricelo Campo > Permissões > Localização e permita durante o uso.');
      const p=await geo.getCurrentPosition({enableHighAccuracy:true,timeout:20000,maximumAge:10000});
      const c=p.coords;inserir(input,c.latitude,c.longitude,c.accuracy);
      if(mapBtn)mapBtn.disabled=false;
      setStatus(status,`Localização capturada e preenchida no campo: ${c.latitude.toFixed(6)}, ${c.longitude.toFixed(6)}${Number.isFinite(c.accuracy)?` (±${Math.round(c.accuracy)} m)`:''}.`);
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
