// Napricelo Campo - item rapido no orcamento com opcao de salvar no catalogo
(function(){
  function htmlNovoItem(){
    return `<label>Produto / serviço<select class="orc-prod" onchange="produtoOrcMudouRapido(this)"><option value="">Novo item (digitar agora)</option></select></label>
    <div class="orc-manual-box">
      <label class="check"><input type="checkbox" class="orc-salvar-catalogo"> <span>Salvar este produto / serviço no catálogo</span></label>
      <div class="two orc-catalogo-detalhes">
        <label>Tipo<select class="orc-tipo-item"><option>Produto</option><option>Serviço</option><option>Manutenção</option><option>Instalação</option></select></label>
        <label>Categoria<input class="orc-categoria" placeholder="Ex.: Biodigestor, SAO, limpeza..."></label>
      </div>
    </div>
    <label>Descrição<input class="orc-desc" required placeholder="Digite o produto ou serviço"></label>
    <div class="two"><label>Quantidade<input class="orc-qtd" type="number" step="0.001" value="1" min="0" oninput="recalcularOrcamento()"></label><label>Valor unitário (R$)<input class="orc-vu" inputmode="decimal" value="0" oninput="recalcularOrcamento()"></label></div>
    <label>Unidade<input class="orc-un" placeholder="un., serviço, m, kg..."></label>
    <div><b>Subtotal: <span class="orc-sub">R$ 0,00</span></b> <button type="button" onclick="this.closest('.orc-item').remove();recalcularOrcamento()">Remover</button></div>`;
  }

  window.adicionarItemOrcamento=function(){
    const box=document.getElementById('orcItens');if(!box)return;
    const row=document.createElement('div');row.className='autobox orc-item';
    row.innerHTML=htmlNovoItem();box.appendChild(row);
    atualizarSelectItem(row.querySelector('.orc-prod'));
    atualizarModoManual(row);
  };

  function atualizarModoManual(row){
    const manual=!row.querySelector('.orc-prod')?.value;
    const box=row.querySelector('.orc-manual-box');if(box)box.style.display=manual?'block':'none';
  }

  window.produtoOrcMudouRapido=function(sel){
    const row=sel.closest('.orc-item');
    const p=comercialProdutos.find(x=>Number(x.id)===Number(sel.value));
    if(p){
      row.querySelector('.orc-desc').value=p.nome||'';
      row.querySelector('.orc-vu').value=Number(p.preco||0).toFixed(2).replace('.',',');
      row.querySelector('.orc-un').value=p.unidade||'';
      const ck=row.querySelector('.orc-salvar-catalogo');if(ck)ck.checked=false;
    }
    atualizarModoManual(row);recalcularOrcamento();
  };

  async function salvarManualNoCatalogo(row,item){
    if(item.produto_id || !row.querySelector('.orc-salvar-catalogo')?.checked)return item;
    const payload={
      codigo:null,
      nome:item.descricao,
      categoria:row.querySelector('.orc-categoria')?.value?.trim()||null,
      tipo_item:row.querySelector('.orc-tipo-item')?.value||'Produto',
      unidade:item.unidade||null,
      preco:item.valor_unitario,
      descricao:item.descricao
    };
    const r=await fetch(`${SUPABASE_URL}/rest/v1/produtos_servicos`,{method:'POST',headers:{...SUPABASE_HEADERS,Prefer:'return=representation'},body:JSON.stringify(payload)});
    if(!r.ok)throw new Error('Falha ao salvar no catálogo: '+await r.text());
    const salvo=(await r.json())[0];
    if(salvo){comercialProdutos.push(salvo);item.produto_id=Number(salvo.id)||null;}
    return item;
  }

  async function salvarOrcamentoRapido(e){
    e.preventDefault();e.stopImmediatePropagation();
    const f=e.currentTarget,o=Object.fromEntries(new FormData(f));
    const cl=clientesCache.find(c=>Number(c.id)===Number(o.cliente_id));
    const un=unidadesCache.find(u=>Number(u.id)===Number(o.unidade_id));
    const rows=[...document.querySelectorAll('.orc-item')];
    let itens=rows.map(r=>({
      row:r,
      produto_id:Number(r.querySelector('.orc-prod').value)||null,
      descricao:r.querySelector('.orc-desc').value.trim(),
      quantidade:Number(r.querySelector('.orc-qtd').value)||0,
      unidade:r.querySelector('.orc-un').value.trim()||null,
      valor_unitario:numBR(r.querySelector('.orc-vu').value)
    })).filter(x=>x.descricao&&x.quantidade>0);
    if(!itens.length)return alert('Inclua pelo menos um item.');

    const botao=f.querySelector('button.primary');const textoBotao=botao?.textContent;
    if(botao){botao.disabled=true;botao.textContent='Salvando...';}
    try{
      for(const x of itens)await salvarManualNoCatalogo(x.row,x);
      const total=recalcularOrcamento(),numero=`ORC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
      const payload={numero,cliente_id:cl?.id||null,unidade_id:un?.id||null,cliente:cl?.nome||null,unidade:un?.nome||null,municipio:un?.municipio||cl?.municipio||null,data:o.data,validade_dias:Number(o.validade_dias)||15,status:'Em elaboração',desconto:numBR(o.desconto),acrescimos:numBR(o.acrescimos),total,forma_pagamento:o.forma_pagamento||null,observacoes:o.observacoes||null,agendar_apos_aprovacao:!!o.agendar_apos_aprovacao};
      let r=await fetch(`${SUPABASE_URL}/rest/v1/orcamentos`,{method:'POST',headers:{...SUPABASE_HEADERS,Prefer:'return=representation'},body:JSON.stringify(payload)});
      if(!r.ok)throw new Error(await r.text());
      const orc=(await r.json())[0];
      const its=itens.map(x=>({produto_id:x.produto_id,descricao:x.descricao,quantidade:x.quantidade,unidade:x.unidade,valor_unitario:x.valor_unitario,orcamento_id:orc.id,subtotal:x.quantidade*x.valor_unitario}));
      r=await fetch(`${SUPABASE_URL}/rest/v1/orcamento_itens`,{method:'POST',headers:{...SUPABASE_HEADERS,Prefer:'return=minimal'},body:JSON.stringify(its)});
      if(!r.ok)throw new Error(await r.text());
      alert(`Orçamento ${numero} salvo.${itens.some(x=>x.row.querySelector('.orc-salvar-catalogo')?.checked)?' Os novos itens marcados também foram salvos no catálogo.':''}`);
      f.reset();document.querySelector('#orcamentoForm [name=data]').value=new Date().toISOString().slice(0,10);document.getElementById('orcItens').innerHTML='';adicionarItemOrcamento();recalcularOrcamento();mostrarComercial('historico');
      carregarProdutosComercial();
    }catch(err){console.error(err);alert('Não foi possível salvar o orçamento. '+(err?.message||''));}
    finally{if(botao){botao.disabled=false;botao.textContent=textoBotao||'Salvar orçamento';}}
  }

  function ativar(){
    const f=document.getElementById('orcamentoForm');if(!f)return false;
    if(f.dataset.itemRapido==='1')return true;
    f.dataset.itemRapido='1';
    f.addEventListener('submit',salvarOrcamentoRapido,true);
    const box=document.getElementById('orcItens');
    if(box){box.innerHTML='';adicionarItemOrcamento();recalcularOrcamento();}
    return true;
  }

  if(!ativar()){
    const obs=new MutationObserver(()=>{if(ativar())obs.disconnect();});
    obs.observe(document.documentElement,{childList:true,subtree:true});
  }
})();
