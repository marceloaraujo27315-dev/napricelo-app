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
 function ajustar(){
   const t=tipo(),ie=form.elements.inscricao_estadual,btn=document.getElementById('clienteBuscarCadastro'),msg=document.getElementById('clienteConsultaMsg');
   if(t==='pj'){
     docLabel.firstChild.textContent='CNPJ';doc.placeholder='CNPJ';busca.style.display='block';btn.textContent='Buscar dados';msg.textContent='Digite o CNPJ e toque em Buscar dados.';
   }else if(t==='produtor'){
     docLabel.firstChild.textContent='CPF do produtor';doc.placeholder='CPF do titular';busca.style.display='block';btn.textContent='Consultar produtor rural';
     msg.textContent='Informe a Inscrição Estadual do produtor. A consulta oficial da SEF/MG será aberta para conferência dos dados cadastrais.';
     if(ie)ie.placeholder='Inscrição Estadual do produtor rural';
   }else{
     docLabel.firstChild.textContent='CPF';doc.placeholder='CPF';busca.style.display='none';
   }
 }
 form.elements.tipo_cliente.addEventListener('change',ajustar); ajustar();
 async function consultarCNPJ(cnpj){
   try{
     const r=await fetch('https://brasilapi.com.br/api/cnpj/v1/'+cnpj,{cache:'no-store'});
     if(r.ok){const d=await r.json();return {nome:d.razao_social||d.nome_fantasia||'',fantasia:d.nome_fantasia||'',municipio:d.municipio||'',endereco:[d.descricao_tipo_de_logradouro,d.logradouro,d.numero,d.complemento,d.bairro,d.cep,d.uf].filter(Boolean).join(', '),telefone:d.ddd_telefone_1||'',email:d.email||'',situacao:d.descricao_situacao_cadastral||''};}
   }catch(e){console.warn('BrasilAPI indisponível',e);}
   const r2=await fetch('https://publica.cnpj.ws/cnpj/'+cnpj,{cache:'no-store'});
   if(!r2.ok)throw new Error('CNPJ não encontrado');
   const d=await r2.json(),e=d.estabelecimento||{},cidade=e.cidade||{},estado=e.estado||{};
   return {nome:d.razao_social||e.nome_fantasia||'',fantasia:e.nome_fantasia||'',municipio:cidade.nome||'',endereco:[e.tipo_logradouro,e.logradouro,e.numero,e.complemento,e.bairro,e.cep,estado.sigla].filter(Boolean).join(', '),telefone:[e.ddd1,e.telefone1].filter(Boolean).join(' '),email:e.email||'',situacao:e.situacao_cadastral||e.descricao_situacao_cadastral||''};
 }
 document.getElementById('clienteBuscarCadastro').addEventListener('click',async()=>{
   const btn=document.getElementById('clienteBuscarCadastro'),msg=document.getElementById('clienteConsultaMsg');
   if(tipo()==='produtor'){
     const ie=String(form.elements.inscricao_estadual?.value||'').trim();
     const cpf=digits(doc.value);
     if(!ie)return alert('Informe primeiro a Inscrição Estadual do produtor rural.');
     if(cpf && cpf.length!==11)return alert('Se informar o CPF do produtor, use 11 números.');
     msg.innerHTML='<b>Consulta oficial aberta.</b> Pesquise pela Inscrição Estadual <b>'+ie.replace(/</g,'&lt;')+'</b> e confira nome, situação cadastral e demais dados antes de salvar.';
     window.open('https://www.fazenda.mg.gov.br/empresas/Cadastro/cadastro/consultapublica.html','_blank','noopener');
     return;
   }
   const cnpj=digits(doc.value); if(cnpj.length!==14)return alert('Informe um CNPJ com 14 números.');
   btn.disabled=true;btn.textContent='Consultando...';msg.textContent='Buscando dados cadastrais...';
   try{
     const d=await consultarCNPJ(cnpj);
     form.elements.nome.value=d.nome||''; form.elements.municipio.value=d.municipio||''; form.elements.endereco.value=d.endereco||'';
     if(form.elements.telefone&&!form.elements.telefone.value)form.elements.telefone.value=d.telefone||'';
     if(form.elements.email&&!form.elements.email.value)form.elements.email.value=d.email||'';
     msg.innerHTML='<b>Dados encontrados.</b> '+(d.fantasia||d.nome||'')+(d.situacao?' • Situação: '+d.situacao:'')+'. Confira antes de salvar.';
   }catch(err){console.error(err);msg.textContent='Não foi possível consultar automaticamente. Você pode preencher os dados manualmente.';alert('Não foi possível consultar este CNPJ agora. Tente novamente em alguns instantes ou preencha manualmente.');}
   finally{btn.disabled=false;btn.textContent='Buscar dados';}
 });
 const baseSalvar=window.salvarRegistroCadastro;
 if(baseSalvar)window.salvarRegistroCadastro=async function(tabela,payload){if(tabela==='clientes')payload={...payload,tipo_cliente:tipo()};return baseSalvar(tabela,payload);};
})();