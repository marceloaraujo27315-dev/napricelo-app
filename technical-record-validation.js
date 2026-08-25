(()=>{
  const codigoValido=v=>/^[A-Za-z0-9]+[-_/][A-Za-z0-9].*/.test(String(v||'').trim());
  function equipamentoSelecionado(form){
    const sel=form.querySelector('.equipSelect, #analiseEquip, select[name="equipamento_id"]');
    if(!sel||sel.value==='')return null;
    const idx=Number(sel.value);
    try{return typeof eqs==='function'?eqs()[idx]:null}catch{return null}
  }
  document.addEventListener('submit',ev=>{
    const f=ev.target;
    if(f?.id==='equipForm'){
      const codigo=f.querySelector('[name="codigo"]')?.value||'';
      if(!codigoValido(codigo)){
        ev.preventDefault();ev.stopImmediatePropagation();
        alert('Informe um código completo para o equipamento, por exemplo ER-00001, BD-01 ou SAO-01.');
        f.querySelector('[name="codigo"]')?.focus();
      }
      return;
    }
    if(f?.classList?.contains('manutForm')||f?.id==='analiseForm'){
      const eq=equipamentoSelecionado(f);
      if(!eq||!eq.id){
        ev.preventDefault();ev.stopImmediatePropagation();
        alert('Selecione um equipamento cadastrado antes de salvar este registro.');
        return;
      }
      if(!codigoValido(eq.codigo)){
        ev.preventDefault();ev.stopImmediatePropagation();
        alert(`O equipamento selecionado possui código incompleto (${eq.codigo||'sem código'}). Corrija o cadastro do equipamento antes de registrar manutenção ou análise.`);
      }
    }
  },true);
})();