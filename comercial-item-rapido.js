// Napricelo Campo - item rapido no orcamento com opcao de salvar no catalogo
(function(){
  function esc(v){return typeof escHtml==='function'?escHtml(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

  async function comprimirFoto(file){
    return new Promise((resolve,reject)=>{
      const rd=new FileReader();
      rd.onerror=reject;
      rd.onload=()=>{
        const img=new Image();
        img.onerror=reject;
        img.onload=()=>{
          const max=900,s=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');
          c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);
          c.getContext('2d').drawImage(img,0,0,c.width,c.height);
          resolve(c.toDataURL('image/jpeg',.76));
        };
        img.src=rd.result;
      };
      rd.readAsDataURL(file);
    });
  }

  function htmlNovoItem(){
    return `<label>Produto / serviço<select class="orc-prod" onchange="produtoOrcMudouRapido(this)"><option value="">Novo item (digitar agora)</option></select></label>
    <div class="orc-prod-foto" style="margin-top:7px"></div>
    <div class="orc-manual-box">
      <label class="check"><input type="checkbox" class="orc-salvar-catalogo"> <span>Salvar este produto / serviço no catálogo</span></label>
      <div class="two orc-catalogo-detalhes">
        <label>Tipo<select class="orc-tipo-item"><option>Produto</option><option>Serviço</option><option>Manutenção</option><option>Instalação</option></select></label>
        <label>Categoria<input class="orc-categoria" placeholder="Ex.: Biodigestor, SAO, limpeza..."></label>
      </div>
      <label>Foto do produto / serviço <small style="font-weight:normal">(opcional — câmera ou galeria)</small><input class="orc-foto-item" type="file" accept="image/*"><div class="orc-foto-preview" style="margin-top:8px"></div></label>
    </div>
    <label>Descrição<input class="orc-desc" required placeholder="Digite o produto ou serviço"></label>
    <div class="two"><label>Quantidade<input class="orc-qtd" type="number" step="0.001" value="1" min="0" oninput="recalcularOrcamento()"></label><label>Valor unitário (R$)<input class="orc-vu" inputmode="decimal" value="0" oninput="recalcularOrcamento()"></label></div>
    <label>Unidade<input class="orc-un" placeholder="un., serviço, m, kg..."></label>
    <div><b>Subtotal: <span class="orc-sub">R$ 0,00</span></b> <button type="button" onclick="this.closest('.orc-item').remove();recalcularOrcamento()">Remover</button></div>`;
  }

  function instalarFotoManual(row){
    const input=row.querySelector('.orc-foto-item');if(!input)return;
    input.addEventListener('change',async()=>{
      const file=input.files?.[0];
      if(!file){row._fotoManual='';row.querySelector('.orc-foto-preview').innerHTML='';return;}
      try{
        row._fotoManual=await comprimirFoto(file);
        row.querySelector('.orc-foto-preview').innerHTML=`<img src="${row._fotoManual}" alt="Foto do item" style="max-width:180px;max-height:130px;object-fit:contain;border:1px solid #dfe7e2;border-radius:8px;padding:4px;background:#fff">`;
      }catch(e){console.error(e);row._fotoManual='';alert('Não foi possível preparar essa imagem. Tente outra foto.');}
    });
  }

  window.adicionarItemOrcamento=function(){
    const box=document.getElementById('orcItens');if(!box)return;
    const row=document.createElement('div');row.className='autobox orc-item';
    row.innerHTML=htmlNovoItem();box.appendChild(row);
    atualizarSelectItem(row.querySelector('.orc-prod'));
    atualizarModoManual(row);
    instalarFotoManual(row);
  };

  function atualizarModoManual(row){
    const manual=!row.querySelector('.orc-prod')?.value;
    const box=row.querySelector('.orc-manual-box');if(box)box.style.display=manual?'block':'none';
    if(!manual){row._fotoManual='';const pv=row.querySelector('.orc-foto-preview');if(pv)pv.innerHTML='';}
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
    const foto=row.querySelector('.orc-prod-foto');if(foto)foto.innerHTML=p?.foto_data?`<img src="${p.foto_data}" alt="${esc(p.nome||'Produto')}" style="max-width:150px;max-height:110px;object-fit:contain;border:1px solid #dfe7e2;border-radius:8px;padding:4px;background:#fff">`:'';
    atualizarModoManual(row);recalcularOrcamento();
  };

  async function salvarManualNoCatalogo(row,item){
    if(item.produto_id || !row.querySelector('.orc-salvar-catalogo')?.checked)return item;
    const payload={codigo:null,nome:item.descricao,categoria:row.querySelector('.orc-categoria')?.value?.trim()||null,tipo_item:row.querySelector('.orc-tipo-item')?.value||'Produto',unidade:item.unidade||null,preco:item.valor_unitario,descricao:item.descricao,foto_data:row._fotoManual||null};
    const r=await fetch(`${SUPABASE_URL}/rest/v1/produtos_servicos`,{method:'POST',headers:{...SUPABASE_HEADERS,Prefer:'return=representation'},body:JSON.stringify(payload)});
    if(!r.ok)throw new Error('Falha ao salvar no catálogo: '+await r.text());
    const salvo=(await r.json())[0];
    if(salvo){comercialProdutos.push(salvo);item.produto_id=Number(salvo.id)||null;}
    return item;
  }

  function htmlClienteRapido(){
    return `<div id="orcClienteRapidoBox" class="autobox" style="display:none;margin-top:8px"><h3 style="margin-top:0">Cadastrar cliente neste orçamento</h3><form id="orcClienteRapidoForm">
      <label>Nome / razão social<input name="nome" required></label><label>Nome fantasia<input name="nome_fantasia" placeholder="Nome pelo qual a empresa é conhecida"></label><label>CNPJ / CPF<input name="documento"></label>
      <div class="two"><label>Município<input name="municipio"></label><label>Telefone<input name="telefone"></label></div><label>Endereço<input name="endereco"></label><label>Responsável / contato<input name="responsavel"></label><label>E-mail<input name="email" type="email"></label><label>Observações<textarea name="observacoes"></textarea></label>
      <div class="mini-actions"><button type="submit" class="primary">Salvar e usar neste orçamento</button><button type="button" onclick="fecharClienteRapido()">Cancelar</button></div></form></div>`;
  }

  function htmlUnidadeRapida(){
    return `<div id="orcUnidadeRapidaBox" class="autobox" style="display:none;margin-top:8px"><h3 style="margin-top:0">Cadastrar unidade / propriedade</h3><form id="orcUnidadeRapidaForm">
      <div class="autobox" id="orcUnidadeClienteInfo">Selecione primeiro o cliente do orçamento.</div><label>Nome da unidade / propriedade<input name="nome" placeholder="Ex.: Sede, Fazenda, Filial" required></label>
      <div class="two"><label>Município<input name="municipio"></label><label>Responsável local<input name="responsavel"></label></div><label>Endereço / localização<input name="endereco"></label><label>Observações<textarea name="observacoes"></textarea></label>
      <div class="mini-actions"><button type="submit" class="primary">Salvar e usar neste orçamento</button><button type="button" onclick="fecharUnidadeRapida()">Cancelar</button></div></form></div>`;
  }

  function htmlEquipamentoRapido(){
    return `<div id="orcEquipRapidoBox" class="autobox" style="display:none;margin-top:8px"><h3 style="margin-top:0">Cadastrar equipamento</h3><form id="orcEquipRapidoForm">
      <div class="autobox" id="orcEquipVinculoInfo">Selecione o cliente e, se houver, a unidade.</div>
      <div class="two"><label>Tipo<select name="tipo"><option>Biodigestor</option><option>Ecobio Reator</option><option>Caixa de Gordura</option><option>SAO</option><option>Caixa de Areia / Desarenador</option><option>Outro</option></select></label><label>Código<input name="codigo" placeholder="Ex.: BD-01" required></label></div>
      <div class="two"><label>Marca / modelo<input name="modelo"></label><label>Capacidade<input name="capacidade" placeholder="Ex.: 1.000 L"></label></div><label>Localização / setor<input name="local"></label><label>Observações<textarea name="observacoes"></textarea></label>
      <div class="mini-actions"><button type="submit" class="primary">Salvar equipamento</button><button type="button" onclick="fecharEquipRapido()">Cancelar</button></div></form></div>`;
  }

  function injetarClienteRapido(){
    const sel=document.getElementById('orcCliente');if(!sel||document.getElementById('orcClienteRapidoBtn'))return;
    const label=sel.closest('label');if(!label)return;
    const btn=document.createElement('button');btn.type='button';btn.id='orcClienteRapidoBtn';btn.className='action';btn.style.marginTop='7px';btn.textContent='+ Cadastrar novo cliente';btn.onclick=()=>{const box=document.getElementById('orcClienteRapidoBox');if(box)box.style.display=box.style.display==='none'?'block':'none';};
    label.appendChild(btn);label.insertAdjacentHTML('afterend',htmlClienteRapido());document.getElementById('orcClienteRapidoForm')?.addEventListener('submit',salvarClienteRapido);
  }

  function atualizarInfoRapidos(){
    const cid=Number(document.getElementById('orcCliente')?.value),uid=Number(document.getElementById('orcUnidade')?.value),c=clientesCache.find(x=>Number(x.id)===cid),u=unidadesCache.find(x=>Number(x.id)===uid);
    const a=document.getElementById('orcUnidadeClienteInfo');if(a)a.innerHTML=c?`Cliente: <b>${esc(c.nome_fantasia||c.nome)}</b>`:'Selecione primeiro o cliente do orçamento.';
    const b=document.getElementById('orcEquipVinculoInfo');if(b)b.innerHTML=c?`Cliente: <b>${esc(c.nome_fantasia||c.nome)}</b>${u?`<br>Unidade: <b>${esc(u.nome)}</b>`:'<br>Sem unidade selecionada.'}`:'Selecione primeiro o cliente do orçamento.';
  }

  function injetarUnidadeEquipRapidos(){
    const sel=document.getElementById('orcUnidade');if(!sel||document.getElementById('orcUnidadeRapidaBtn'))return;
    const label=sel.closest('label');if(!label)return;
    const wrap=document.createElement('div');wrap.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:7px';
    const bu=document.createElement('button');bu.type='button';bu.id='orcUnidadeRapidaBtn';bu.className='action';bu.textContent='+ Cadastrar nova unidade';bu.onclick=()=>{if(!document.getElementById('orcCliente')?.value)return alert('Selecione ou cadastre primeiro o cliente.');const box=document.getElementById('orcUnidadeRapidaBox');if(box){atualizarInfoRapidos();box.style.display=box.style.display==='none'?'block':'none';}};
    const be=document.createElement('button');be.type='button';be.id='orcEquipRapidoBtn';be.className='action';be.textContent='+ Cadastrar equipamento';be.onclick=()=>{if(!document.getElementById('orcCliente')?.value)return alert('Selecione ou cadastre primeiro o cliente.');const box=document.getElementById('orcEquipRapidoBox');if(box){atualizarInfoRapidos();box.style.display=box.style.display==='none'?'block':'none';}};
    wrap.append(bu,be);label.appendChild(wrap);label.insertAdjacentHTML('afterend',htmlUnidadeRapida()+htmlEquipamentoRapido());
    document.getElementById('orcUnidadeRapidaForm')?.addEventListener('submit',salvarUnidadeRapida);document.getElementById('orcEquipRapidoForm')?.addEventListener('submit',salvarEquipRapido);
    document.getElementById('orcCliente')?.addEventListener('change',()=>{fecharUnidadeRapida();fecharEquipRapido();setTimeout(atualizarInfoRapidos,0);});document.getElementById('orcUnidade')?.addEventListener('change',atualizarInfoRapidos);
  }

  window.fecharClienteRapido=function(){const box=document.getElementById('orcClienteRapidoBox');if(box)box.style.display='none';};
  window.fecharUnidadeRapida=function(){const box=document.getElementById('orcUnidadeRapidaBox');if(box)box.style.display='none';};
  window.fecharEquipRapido=function(){const box=document.getElementById('orcEquipRapidoBox');if(box)box.style.display='none';};

  async function salvarClienteRapido(e){
    e.preventDefault();const form=e.currentTarget,o=Object.fromEntries(new FormData(form)),nome=(o.nome||'').trim();if(!nome)return alert('Informe o nome / razão social do cliente.');
    if(clientesCache.some(c=>String(c.nome||'').trim().toLocaleLowerCase('pt-BR')===nome.toLocaleLowerCase('pt-BR')))return alert('Já existe um cliente com esse nome. Selecione-o na lista acima.');
    const btn=form.querySelector('button[type="submit"]'),txt=btn?.textContent;if(btn){btn.disabled=true;btn.textContent='Salvando...';}
    try{const payload={nome,nome_fantasia:o.nome_fantasia?.trim()||null,documento:o.documento?.trim()||null,municipio:o.municipio?.trim()||null,endereco:o.endereco?.trim()||null,responsavel:o.responsavel?.trim()||null,telefone:o.telefone?.trim()||null,email:o.email?.trim()||null,observacoes:o.observacoes?.trim()||null};let salvo;
      if(typeof salvarRegistroCadastro==='function')salvo=await salvarRegistroCadastro('clientes',payload);else{const r=await fetch(`${SUPABASE_URL}/rest/v1/clientes`,{method:'POST',headers:{...SUPABASE_HEADERS,Prefer:'return=representation'},body:JSON.stringify(payload)});if(!r.ok)throw new Error(await r.text());salvo=(await r.json())[0];}
      clientesCache.push(salvo);clientesCache.sort((a,b)=>(a.nome_fantasia||a.nome||'').localeCompare((b.nome_fantasia||b.nome||''),'pt-BR'));if(typeof atualizarSelectsClientes==='function')atualizarSelectsClientes();if(typeof renderClientesUnidades==='function')renderClientesUnidades();if(typeof preencherClientesComercial==='function')preencherClientesComercial();
      const sel=document.getElementById('orcCliente');if(sel){sel.value=String(salvo.id);if(typeof preencherUnidadesOrcamento==='function')preencherUnidadesOrcamento();}form.reset();fecharClienteRapido();atualizarInfoRapidos();alert('Cliente salvo e já selecionado neste orçamento.');
    }catch(err){console.error(err);alert(/duplicate key|unique constraint|23505/i.test(String(err?.message||err))?'Já existe um cliente com esse nome.':'Não foi possível salvar o cliente.');}finally{if(btn){btn.disabled=false;btn.textContent=txt||'Salvar e usar neste orçamento';}}
  }

  async function salvarUnidadeRapida(e){
    e.preventDefault();const form=e.currentTarget,o=Object.fromEntries(new FormData(form)),cid=Number(document.getElementById('orcCliente')?.value),nome=(o.nome||'').trim();if(!cid)return alert('Selecione primeiro o cliente.');if(!nome)return alert('Informe o nome da unidade / propriedade.');
    if(unidadesCache.some(u=>Number(u.cliente_id)===cid&&String(u.nome||'').trim().toLocaleLowerCase('pt-BR')===nome.toLocaleLowerCase('pt-BR')))return alert('Essa unidade já está cadastrada para este cliente.');
    const btn=form.querySelector('button[type="submit"]'),txt=btn?.textContent;if(btn){btn.disabled=true;btn.textContent='Salvando...';}
    try{const payload={cliente_id:cid,nome,municipio:o.municipio?.trim()||null,endereco:o.endereco?.trim()||null,responsavel:o.responsavel?.trim()||null,observacoes:o.observacoes?.trim()||null};let salvo;
      if(typeof salvarRegistroCadastro==='function')salvo=await salvarRegistroCadastro('unidades',payload);else{const r=await fetch(`${SUPABASE_URL}/rest/v1/unidades`,{method:'POST',headers:{...SUPABASE_HEADERS,Prefer:'return=representation'},body:JSON.stringify(payload)});if(!r.ok)throw new Error(await r.text());salvo=(await r.json())[0];}
      unidadesCache.push(salvo);unidadesCache.sort((a,b)=>(a.nome||'').localeCompare(b.nome||'','pt-BR'));if(typeof atualizarSelectsClientes==='function')atualizarSelectsClientes();if(typeof renderClientesUnidades==='function')renderClientesUnidades();if(typeof preencherUnidadesOrcamento==='function')preencherUnidadesOrcamento();
      const sel=document.getElementById('orcUnidade');if(sel)sel.value=String(salvo.id);form.reset();fecharUnidadeRapida();atualizarInfoRapidos();alert('Unidade salva e já selecionada neste orçamento.');
    }catch(err){console.error(err);alert(/duplicate key|unique constraint|23505/i.test(String(err?.message||err))?'Essa unidade já está cadastrada para este cliente.':'Não foi possível salvar a unidade.');}finally{if(btn){btn.disabled=false;btn.textContent=txt||'Salvar e usar neste orçamento';}}
  }

  async function salvarEquipRapido(e){
    e.preventDefault();const form=e.currentTarget,o=Object.fromEntries(new FormData(form)),cid=Number(document.getElementById('orcCliente')?.value),uid=Number(document.getElementById('orcUnidade')?.value),c=clientesCache.find(x=>Number(x.id)===cid),u=unidadesCache.find(x=>Number(x.id)===uid),codigo=(o.codigo||'').trim();
    if(!c)return alert('Selecione primeiro o cliente.');if(!codigo)return alert('Informe o código do equipamento.');if((typeof eqs==='function'?eqs():equipCache||[]).some(x=>String(x.codigo||'').trim().toLocaleLowerCase('pt-BR')===codigo.toLocaleLowerCase('pt-BR')))return alert('Já existe equipamento com esse código.');
    const btn=form.querySelector('button[type="submit"]'),txt=btn?.textContent;if(btn){btn.disabled=true;btn.textContent='Salvando...';}
    try{const payload={codigo,cliente:c.nome_fantasia||c.nome||null,unidade:u?.nome||null,municipio:u?.municipio||c.municipio||null,tipo:o.tipo||null,modelo:o.modelo?.trim()||null,capacidade:o.capacidade?.trim()||null,local:o.local?.trim()||null,observacoes:o.observacoes?.trim()||null};let salvo;
      if(typeof salvarEquipamentoNuvem==='function')salvo=await salvarEquipamentoNuvem(payload);else{const r=await fetch(`${SUPABASE_URL}/rest/v1/equipamentos`,{method:'POST',headers:{...SUPABASE_HEADERS,Prefer:'return=representation'},body:JSON.stringify({codigo:payload.codigo,cliente:payload.cliente,unidade:payload.unidade,municipio:payload.municipio,tipo:payload.tipo,modelo:payload.modelo,capacidade:payload.capacidade,localizacao:payload.local,observacoes:payload.observacoes})});if(!r.ok)throw new Error(await r.text());salvo=(await r.json())[0];}
      if(typeof equipCache!=='undefined'){equipCache.push({...payload,...salvo});if(typeof db!=='undefined'&&db?.set)db.set('equip',equipCache);}if(typeof refreshEquipSelectors==='function')refreshEquipSelectors();form.reset();fecharEquipRapido();alert(`Equipamento ${codigo} salvo no cadastro.`);
    }catch(err){console.error(err);alert('Não foi possível salvar o equipamento.');}finally{if(btn){btn.disabled=false;btn.textContent=txt||'Salvar equipamento';}}
  }

  async function salvarOrcamentoRapido(e){
    e.preventDefault();e.stopImmediatePropagation();const f=e.currentTarget,o=Object.fromEntries(new FormData(f));const cl=clientesCache.find(c=>Number(c.id)===Number(o.cliente_id));const un=unidadesCache.find(u=>Number(u.id)===Number(o.unidade_id));const rows=[...document.querySelectorAll('.orc-item')];
    let itens=rows.map(r=>({row:r,produto_id:Number(r.querySelector('.orc-prod').value)||null,descricao:r.querySelector('.orc-desc').value.trim(),quantidade:Number(r.querySelector('.orc-qtd').value)||0,unidade:r.querySelector('.orc-un').value.trim()||null,valor_unitario:numBR(r.querySelector('.orc-vu').value)})).filter(x=>x.descricao&&x.quantidade>0);
    if(!cl)return alert('Selecione um cliente ou cadastre um novo cliente neste orçamento.');if(!itens.length)return alert('Inclua pelo menos um item.');
    const botao=f.querySelector('button.primary');const textoBotao=botao?.textContent;if(botao){botao.disabled=true;botao.textContent='Salvando...';}
    try{for(const x of itens)await salvarManualNoCatalogo(x.row,x);const total=recalcularOrcamento(),numero=`ORC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;const payload={numero,cliente_id:cl?.id||null,unidade_id:un?.id||null,cliente:cl?.nome||null,unidade:un?.nome||null,municipio:un?.municipio||cl?.municipio||null,data:o.data,validade_dias:Number(o.validade_dias)||15,status:'Em elaboração',desconto:numBR(o.desconto),acrescimos:numBR(o.acrescimos),total,forma_pagamento:o.forma_pagamento||null,observacoes:o.observacoes||null,agendar_apos_aprovacao:!!o.agendar_apos_aprovacao};
      let r=await fetch(`${SUPABASE_URL}/rest/v1/orcamentos`,{method:'POST',headers:{...SUPABASE_HEADERS,Prefer:'return=representation'},body:JSON.stringify(payload)});if(!r.ok)throw new Error(await r.text());const orc=(await r.json())[0];const its=itens.map(x=>({produto_id:x.produto_id,descricao:x.descricao,quantidade:x.quantidade,unidade:x.unidade,valor_unitario:x.valor_unitario,orcamento_id:orc.id,subtotal:x.quantidade*x.valor_unitario}));r=await fetch(`${SUPABASE_URL}/rest/v1/orcamento_itens`,{method:'POST',headers:{...SUPABASE_HEADERS,Prefer:'return=minimal'},body:JSON.stringify(its)});if(!r.ok)throw new Error(await r.text());
      alert(`Orçamento ${numero} salvo.${itens.some(x=>x.row.querySelector('.orc-salvar-catalogo')?.checked)?' Os novos itens marcados também foram salvos no catálogo.':''}`);f.reset();document.querySelector('#orcamentoForm [name=data]').value=new Date().toISOString().slice(0,10);document.getElementById('orcItens').innerHTML='';adicionarItemOrcamento();recalcularOrcamento();mostrarComercial('historico');carregarProdutosComercial();
    }catch(err){console.error(err);alert('Não foi possível salvar o orçamento. '+(err?.message||''));}finally{if(botao){botao.disabled=false;botao.textContent=textoBotao||'Salvar orçamento';}}
  }

  function ativar(){const f=document.getElementById('orcamentoForm');if(!f)return false;injetarClienteRapido();injetarUnidadeEquipRapidos();if(f.dataset.itemRapido==='1')return true;f.dataset.itemRapido='1';f.addEventListener('submit',salvarOrcamentoRapido,true);const box=document.getElementById('orcItens');if(box){box.innerHTML='';adicionarItemOrcamento();recalcularOrcamento();}return true;}
  if(!ativar()){const obs=new MutationObserver(()=>{if(ativar())obs.disconnect();});obs.observe(document.documentElement,{childList:true,subtree:true});}
})();
