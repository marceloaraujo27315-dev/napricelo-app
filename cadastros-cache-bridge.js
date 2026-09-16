// Compatibilidade entre os caches de cadastros (declarados com let) e os módulos dinâmicos do app.
// Expõe clientesCache e unidadesCache em window sem duplicar os dados.
(()=>{
  function expor(nome,getter,setter){
    try{
      const d=Object.getOwnPropertyDescriptor(window,nome);
      if(d?.get)return;
      Object.defineProperty(window,nome,{configurable:true,enumerable:false,get:getter,set:setter});
    }catch(e){console.warn('Não foi possível expor '+nome,e);}
  }
  try{
    expor('clientesCache',()=>clientesCache,v=>{clientesCache=Array.isArray(v)?v:[];});
    expor('unidadesCache',()=>unidadesCache,v=>{unidadesCache=Array.isArray(v)?v:[];});
  }catch(e){
    // Se cadastros.js ainda não terminou de carregar, tenta novamente logo após.
    setTimeout(()=>{
      try{
        expor('clientesCache',()=>clientesCache,v=>{clientesCache=Array.isArray(v)?v:[];});
        expor('unidadesCache',()=>unidadesCache,v=>{unidadesCache=Array.isArray(v)?v:[];});
      }catch(err){console.warn('Bridge de cadastros indisponível',err);}
    },300);
  }
})();
