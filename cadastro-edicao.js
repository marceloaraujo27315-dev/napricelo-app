(function(){
  "use strict";
  const clean=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const trim=v=>String(v??"").trim();
  let busy=false;
  const st=document.createElement("style");
  st.textContent=".nap-edit-overlay{position:fixed;inset:0;background:#0009;z-index:999999;display:flex;align-items:center;justify-content:center;padding:12px}.nap-edit-window{background:#fff;color:#22342b;border-radius:12px;padding:18px;width:min(96vw,600px);max-height:92vh;overflow:auto}.nap-edit-window h2{color:#176b45;margin:0 0 7px}.nap-edit-window label{display:block;margin:9px 0;font-weight:600}.nap-edit-window input,.nap-edit-window textarea,.nap-edit-window select{display:block;width:100%;box-sizing:border-box;border:1px solid #adc8b8;border-radius:6px;padding:10px;margin-top:4px;color:#222;background:#fff}.nap-edit-controls{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}.nap-edit-controls button{padding:10px;border:0;border-radius:7px;font-weight:bold;background:#176b45;color:white}.nap-edit-controls button[type=button]{background:#e9f2ed;color:#176b45}.nap-edit-error{color:#9e2525;margin-top:10px}.nap-edit-btn{background:#176b45!important;color:#fff!important}";
  document.head.appendChild(st);
  function editor(title,fields,save){
    document.getElementById("nap-edit-overlay")?.remove();
    const outer=document.createElement("div");outer.className="nap-edit-overlay";outer.id="nap-edit-overlay";
    let html='<form class="nap-edit-window"><h2>'+clean(title)+'</h2><p>Edite os campos e salve as alterações no cadastro existente.</p>';
    fields.forEach(f=>{
      html+='<label>'+clean(f.label);
      if(f.options){html+='<select name="'+f.name+'">'+f.options.map(o=>'<option value="'+clean(o.value)+'"'+(String(o.value)===String(f.value)?' selected':'')+'>'+clean(o.label)+'</option>').join('')+'</select>';}
      else if(f.multiline){html+='<textarea name="'+f.name+'">'+clean(f.value)+'</textarea>';}
      else {html+='<input name="'+f.name+'" value="'+clean(f.value)+'"'+(f.required?' required':'')+'>';}
      html+='</label>';
    });
    html+='<p class="nap-edit-error" role="alert"></p><div class="nap-edit-controls"><button type="button" class="nap-edit-cancel">Cancelar</button><button type="submit">Salvar alterações</button></div></form>';
    outer.innerHTML=html;document.body.appendChild(outer);
    outer.querySelector(".nap-edit-cancel").onclick=()=>{if(!busy)outer.remove();};
    outer.querySelector("form").onsubmit=async ev=>{
      ev.preventDefault();if(busy)return;
      const data=Object.fromEntries(new FormData(ev.currentTarget));
      const btn=outer.querySelector('[type=submit]'),err=outer.querySelector('.nap-edit-error');
      busy=true;btn.disabled=true;btn.textContent='Salvando...';err.textContent='';
      try{await save(data);outer.remove();alert('Cadastro atualizado com sucesso.');}
      catch(e){console.error(e);err.textContent='Não foi possível atualizar: '+String(e.message||e);btn.disabled=false;btn.textContent='Salvar alterações';}
      finally{busy=false;}
    };
  }
  const fld=(name,label,value,required)=>({name,label,value:value??'',required:!!required});
  const memo=(name,label,value)=>({name,label,value:value??'',multiline:true});
  window.editarUnidade=function(id){
    const u=unidadesCache.find(x=>Number(x.id)===Number(id));if(!u)return alert('Unidade não encontrada.');
    const customers=clientesCache.map(c=>({value:c.id,label:c.nome_fantasia||c.nome||('Cliente '+c.id)}));
    editor('Editar unidade / propriedade',[
      {name:'cliente_id',label:'Cliente / empreendimento',value:u.cliente_id,options:customers},
      fld('nome','Nome da unidade / propriedade',u.nome,true),fld('municipio','Cidade / município',u.municipio),
      fld('endereco','Endereço / localização',u.endereco),fld('responsavel','Responsável local',u.responsavel),
      memo('observacoes','Observações',u.observacoes)
    ],async d=>{
      const cliente_id=Number(d.cliente_id),nome=trim(d.nome);
      if(!cliente_id||!nome)throw Error('Informe o cliente e o nome.');
      if(unidadesCache.some(x=>Number(x.id)!==Number(id)&&Number(x.cliente_id)===cliente_id&&trim(x.nome).toLocaleLowerCase('pt-BR')===nome.toLocaleLowerCase('pt-BR')))throw Error('Essa unidade já existe para este cliente.');
      const payload={cliente_id,nome,municipio:trim(d.municipio)||null,endereco:trim(d.endereco)||null,responsavel:trim(d.responsavel)||null,observacoes:trim(d.observacoes)||null};
      const saved=await atualizarRegistroCadastro('unidades',id,payload);
      if(!saved)throw Error('O banco não confirmou a alteração.');
      Object.assign(u,saved);unidadesCache.sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR'));
      atualizarSelectsClientes();renderClientesUnidades();
    });
  };
  window.editarEquipamentoCadastro=function(id){
    const eqList=typeof eqs==='function'?eqs():[];
    const e=eqList.find(x=>Number(x.id)===Number(id))||(window.clienteFichaCache?.equip||[]).find(x=>Number(x.id)===Number(id));
    if(!e)return alert('Equipamento não encontrado. Atualize a lista.');
    const tipos=['Biodigestor','Caixa de Gordura','SAO','Caixa de Areia / Desarenador','Ecobio Reator'];
    if(e.tipo&&!tipos.includes(e.tipo))tipos.push(e.tipo);
    editor('Editar equipamento',[
      fld('codigo','Código do equipamento',e.codigo,true),fld('cliente','Cliente / empreendimento',e.cliente,true),
      fld('unidade','Unidade / propriedade',e.unidade),fld('municipio','Cidade / município',e.municipio),
      {name:'tipo',label:'Tipo',value:e.tipo,options:tipos.map(t=>({value:t,label:t}))},
      fld('modelo','Marca / modelo',e.modelo),fld('capacidade','Capacidade',e.capacidade),
      fld('localizacao','Localização / setor',e.localizacao||e.local),memo('observacoes','Observações',e.observacoes)
    ],async d=>{
      const codigo=trim(d.codigo),cliente=trim(d.cliente);
      if(!codigo||!cliente)throw Error('Código e cliente são obrigatórios.');
      if(eqList.some(x=>Number(x.id)!==Number(id)&&trim(x.codigo).toLocaleLowerCase('pt-BR')===codigo.toLocaleLowerCase('pt-BR')))throw Error('O código já pertence a outro equipamento.');
      const payload={codigo,cliente,unidade:trim(d.unidade)||null,municipio:trim(d.municipio)||null,tipo:d.tipo,modelo:trim(d.modelo)||null,capacidade:trim(d.capacidade)||null,localizacao:trim(d.localizacao)||null,observacoes:trim(d.observacoes)||null};
      const res=await fetch(SUPABASE_URL+'/rest/v1/equipamentos?id=eq.'+Number(id),{method:'PATCH',headers:{...SUPABASE_HEADERS,Prefer:'return=representation'},body:JSON.stringify(payload)});
      if(!res.ok)throw Error('Banco de dados: '+res.status+' '+(await res.text()).slice(0,200));
      const saved=(await res.json())[0];if(!saved)throw Error('O banco não confirmou a alteração.');
      const original=eqList.find(x=>Number(x.id)===Number(id));if(original)Object.assign(original,saved);
      const ficha=(window.clienteFichaCache?.equip||[]).find(x=>Number(x.id)===Number(id));if(ficha)Object.assign(ficha,saved);
      if(typeof db!=='undefined')db.set('equip',eqList);
      if(typeof refreshEquipSelectors==='function')refreshEquipSelectors();
      if(typeof fecharFichaEquipamento==='function')fecharFichaEquipamento();
      if(document.getElementById('historico')?.classList.contains('active')&&typeof renderHistorico==='function')renderHistorico('equip');
    });
  };
  const oldOpen=window.abrirFichaEquipamento;
  if(typeof oldOpen==='function')window.abrirFichaEquipamento=function(id){
    const result=oldOpen.apply(this,arguments);
    const actions=document.querySelector('#equipProfileContent .equip-actions');
    if(actions&&!actions.querySelector('.nap-edit-btn')){
      const btn=document.createElement('button');btn.type='button';btn.className='nap-edit-btn';btn.textContent='Editar equipamento';btn.onclick=()=>window.editarEquipamentoCadastro(id);actions.appendChild(btn);
    }
    return result;
  };
})();