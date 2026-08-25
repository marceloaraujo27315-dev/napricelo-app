(function(){
 const form=document.getElementById('clienteForm'); if(!form)return;
 const doc=form.elements.documento; if(!doc)return;
 const docLabel=doc.closest('label');
 const tipoLabel=document.createElement('label');
 tipoLabel.innerHTML='Tipo de cliente<select name="tipo_cliente" id="clienteTipo"><option value="pj">Pessoa jurídica – CNPJ</option><option value="produtor">Produtor rural – IE / CPF</option><option value="pf">Pessoa física – CPF</option></select>';
 docLabel.insertAdjacentElement('beforebegin',tipoLabel);
 const busca=document.createElement('div'); busca.className='autobox'; busca.id='clienteConsultaBox';
 busca.innerHTML='<b>Consulta cadastral</b><br><span id="clienteConsultaMsg">Digite o CNPJ e use a busca automática.</span><br><button type="button" id="clienteBuscarCadastro" style="margin-top:8px">Buscar dados</button>';
 docLabel.insertAdjacentElement('afterend',busca);
 function digits(v){return String(v||'').replace(/\D/g,'');}
 function tipo(){return form.elements.tipo_cliente?.value||'pj';}
 function ajustar(){const t=tipo(),ie=form.elements.inscricao_estadual; if(t==='pj'){docLabel.firstChild.textContent='CNPJ';doc.placeholder='CNPJ';busca.style.display='block';document.getElementById('clienteConsultaMsg').textContent='Digite o CNPJ e toque em Buscar dados.';}else if(t==='produtor'){docLabel.firstChild.textContent='CPF do produtor';doc.placeholder='CPF';busca.style.display='block';document.getElementById('clienteConsultaMsg').textContent='Informe a Inscrição Estadual e a UF. Para Minas Gerais, o botão abre a consulta pública da SEF/MG.';if(ie)ie.placeholder='Inscrição Estadual do produtor rural';}else{docLabel.firstChild.textContent='CPF';doc.placeholder='CPF';busca.style.display='none';} }
 form.elements.tipo_cliente.addEventListener('change',ajustar); ajustar();
 document.getElementById('clienteBuscarCadastro').addEventListener('click',async()=>{
   const btn=document.getElementById('clienteBuscarCadastro'),msg=document.getElementById('clienteConsultaMsg');
   if(tipo()==='produtor'){
     const ie=String(form.elements.inscricao_estadual?.value||'').trim();
     if(!ie)return alert('Informe primeiro a Inscrição Estadual do produtor rural.');
     window.open('https://www.fazenda.mg.gov.br/empresas/Cadastro/cadastro/consultapublica.html','_blank');
     msg.textContent='Consulta pública da SEF/MG aberta. Confira os dados do produtor e complete o cadastro.'; return;
   }
   const cnpj=digits(doc.value); if(cnpj.length!==14)return alert('Informe um CNPJ com 14 números.');
   btn.disabled=true;btn.textContent='Consultando...';msg.textContent='Buscando dados cadastrais...';
   try{
     const r=await fetch('https://brasilapi.com.br/api/cnpj/v1/'+cnpj); if(!r.ok)throw new Error('CNPJ não encontrado'); const d=await r.json();
     form.elements.nome.value=d.razao_social||d.nome_fantasia||'';
     form.elements.municipio.value=d.municipio||'';
     const end=[d.descricao_tipo_de_logradouro,d.logradouro,d.numero,d.complemento,d.bairro,d.cep,d.uf].filter(Boolean).join(', '); form.elements.endereco.value=end;
     if(form.elements.telefone&&!form.elements.telefone.value)form.elements.telefone.value=d.ddd_telefone_1||'';
     if(form.elements.email&&!form.elements.email.value)form.elements.email.value=d.email||'';
     msg.innerHTML='<b>Dados encontrados.</b> '+(d.nome_fantasia||d.razao_social||'')+' • Situação: '+(d.descricao_situacao_cadastral||'não informada')+'. Confira antes de salvar.';
   }catch(err){console.error(err);msg.textContent='Não foi possível consultar automaticamente. Você pode preencher os dados manualmente.';alert('Consulta automática indisponível ou CNPJ não encontrado.');}
   finally{btn.disabled=false;btn.textContent='Buscar dados';}
 });
 const baseSalvar=window.salvarRegistroCadastro;
 if(baseSalvar)window.salvarRegistroCadastro=async function(tabela,payload){if(tabela==='clientes')payload={...payload,tipo_cliente:tipo()};return baseSalvar(tabela,payload);};
})();