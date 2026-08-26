(()=>{
  const base=window.salvarRegistroCadastro;
  if(typeof base!=='function')return;
  window.salvarRegistroCadastro=async function(tabela,payload){
    try{return await base(tabela,payload)}catch(err){
      const msg=String(err?.message||err||'');
      const schemaProblema=/PGRST204|column .* does not exist|schema cache|tipo_cliente|inscricao_estadual/i.test(msg);
      if(tabela!=='clientes'||!schemaProblema)throw err;
      const limpo={...payload};delete limpo.tipo_cliente;delete limpo.inscricao_estadual;
      const r=await fetch(`${SUPABASE_URL}/rest/v1/clientes`,{method:'POST',headers:{...SUPABASE_HEADERS,Prefer:'return=representation'},body:JSON.stringify(limpo)});
      if(!r.ok)throw new Error(await r.text());
      return (await r.json())[0];
    }
  };
})();