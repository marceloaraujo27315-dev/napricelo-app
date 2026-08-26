(()=>{
  function textoLimpo(v){
    if(v===undefined||v===null)return '';
    let s=String(v).trim();
    if(!s)return '';
    const puro=s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    if(/^(offline|online|null|undefined|nan|n\/a|nao informado|não informado|sem informacao|sem informação|-|—)$/i.test(puro))return '';
    // Não levar para o relatório valores técnicos de armazenamento, links de arquivos ou carimbos internos.
    if(/^https?:\/\//i.test(s))return '';
    if(/^data:/i.test(s))return '';
    if(/^blob:/i.test(s))return '';
    if(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?$/i.test(s))return '';
    if(/supabase\.co\/storage\/v1\/object/i.test(s))return '';
    return s;
  }

  function fraseInterna(x){
    const t=String(x||'').trim();
    if(!t)return true;
    if(/(^|\s)https?:\/\//i.test(t))return true;
    if(/supabase\.co\/storage\/v1\/object/i.test(t))return true;
    if(/(^|\s)(blob:|data:application|data:image)/i.test(t))return true;
    if(/(^|\s)\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?(\s|$)/i.test(t))return true;
    if(/(^|\b)(offline|online|null|undefined|nan)(\b|$)/i.test(t))return true;
    return false;
  }

  function limparFrasesInternas(v){
    const s=textoLimpo(v);
    if(!s)return '';
    const partes=s
      .split(/(?<=[.!?])\s+|\n+/)
      .map(x=>x.trim())
      .filter(Boolean)
      .filter(x=>!fraseInterna(x));
    return partes.join(' ').trim();
  }

  function limparCampos(campos){
    if(!campos||typeof campos!=='object')return campos;
    const out={};
    Object.entries(campos).forEach(([k,v])=>{
      // Metadados de anexos nunca devem ser usados como conteúdo narrativo do relatório.
      if(/(?:^|_)(?:foto|arquivo|anexo|pdf|url|storage|upload|enviado|anexado|timestamp|created|updated)(?:_|$)/i.test(String(k)))return;
      const limpo=limparFrasesInternas(v);
      if(limpo)out[k]=limpo;
    });
    return out;
  }

  function prepararRegistro(x){
    if(!x)return null;
    return {
      campos:x.campos,
      observacoes:x.observacoes,
      situacao_encontrada:x.situacao_encontrada,
      atividades_executadas:x.atividades_executadas,
      servicos:x.servicos,
      avaliacao_tecnica:x.avaliacao_tecnica,
      conclusao_tecnica:x.conclusao_tecnica,
      recomendacoes:x.recomendacoes,
      objeto_relatorio:x.objeto_relatorio
    };
  }

  function aplicarLimpeza(x){
    if(!x)return;
    x.campos=limparCampos(x.campos);
    x.observacoes=limparFrasesInternas(x.observacoes);
    x.situacao_encontrada=limparFrasesInternas(x.situacao_encontrada);
    x.atividades_executadas=limparFrasesInternas(x.atividades_executadas);
    x.servicos=limparFrasesInternas(x.servicos);
    x.avaliacao_tecnica=limparFrasesInternas(x.avaliacao_tecnica);
    x.conclusao_tecnica=limparFrasesInternas(x.conclusao_tecnica);
    x.recomendacoes=limparFrasesInternas(x.recomendacoes);
    x.objeto_relatorio=limparFrasesInternas(x.objeto_relatorio);
  }

  function restaurar(x,b){
    if(!x||!b)return;
    Object.assign(x,b);
  }

  function instalar(){
    if(window.__relatorioTecnicoConteudoFix||typeof window.gerarRelatorioTecnicoExecucao!=='function')return;
    window.__relatorioTecnicoConteudoFix=true;
    const original=window.gerarRelatorioTecnicoExecucao;
    window.gerarRelatorioTecnicoExecucao=function(id){
      let x=null,backup=null;
      try{
        const lista=window.cloudHistorico?.manut||((typeof cloudHistorico!=='undefined'&&cloudHistorico.manut)||[]);
        x=lista.find(r=>String(r.id)===String(id));
        if(x){backup=prepararRegistro(x);aplicarLimpeza(x);}
        return original.apply(this,arguments);
      }finally{
        if(x&&backup)restaurar(x,backup);
      }
    };
  }

  instalar();
  setTimeout(instalar,300);
})();