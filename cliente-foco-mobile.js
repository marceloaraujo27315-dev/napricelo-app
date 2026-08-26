(()=>{
  const clientes=document.getElementById('clientes');
  const formCliente=document.getElementById('clienteForm');
  const formUnidade=document.getElementById('unidadeForm');
  if(!clientes||!formCliente||!formUnidade)return;
  function addVoltar(form){if(form.querySelector('.cliente-voltar'))return;const b=document.createElement('button');b.type='button';b.className='cliente-voltar';b.textContent='← Voltar para clientes';b.onclick=()=>sair();form.insertBefore(b,form.firstChild);}
  function foco(form){if(window.innerWidth>900)return;clientes.classList.add('cadastro-foco');formCliente.classList.toggle('form-foco',form===formCliente);formUnidade.classList.toggle('form-foco',form===formUnidade);addVoltar(form);window.scrollTo({top:0,behavior:'smooth'});}
  function sair(){clientes.classList.remove('cadastro-foco');formCliente.classList.remove('form-foco');formUnidade.classList.remove('form-foco');formCliente.style.display='block';formUnidade.style.display='none';window.scrollTo({top:0,behavior:'smooth'});}
  const baseCliente=window.mostrarCadastroCliente;window.mostrarCadastroCliente=function(){if(baseCliente)baseCliente();foco(formCliente)};
  const baseUnidade=window.mostrarCadastroUnidade;window.mostrarCadastroUnidade=function(){if(baseUnidade)baseUnidade();foco(formUnidade)};
  window.sairCadastroFoco=sair;
})();