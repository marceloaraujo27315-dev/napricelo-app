const PHOTO_SUPABASE_URL="https://zhdcekhqntytiswdjqaw.supabase.co";
const PHOTO_SUPABASE_KEY="sb_publishable_bcVp32RbgpOHOYbmjcaAPg_G4fiLDIw";
const PHOTO_BUCKET="manutencoes-fotos";

function photoAccessToken(){try{return JSON.parse(localStorage.getItem('napricelo_auth_session')||'null')?.access_token||''}catch{return ''}}
function photoAuthHeaders(extra={}){const jwt=photoAccessToken();if(!jwt)throw new Error('Faça login novamente para salvar fotos.');return {apikey:PHOTO_SUPABASE_KEY,Authorization:`Bearer ${jwt}`,...extra}}
function photoExt(file){
  const byName=(file.name||"").split(".").pop().toLowerCase();
  if(["jpg","jpeg","png","webp"].includes(byName)) return byName==="jpeg"?"jpg":byName;
  if(file.type==="image/png") return "png";
  if(file.type==="image/webp") return "webp";
  return "jpg";
}
function contextoEdicaoPOP(){try{return JSON.parse(sessionStorage.getItem('napricelo_pop_edicao')||'null')}catch{return null}}

async function uploadFotoManutencao(file,codigo,etapa){
  if(!file||!file.size) return null;
  if(file.size>10*1024*1024) throw new Error(`A foto ${etapa} ultrapassa 10 MB.`);
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)) throw new Error(`Formato de foto não aceito em ${etapa}.`);
  const safe=(codigo||"equipamento").replace(/[^a-zA-Z0-9_-]/g,"-");
  const path=`${safe}/${Date.now()}-${crypto.randomUUID()}-${etapa}.${photoExt(file)}`;
  const r=await fetch(`${PHOTO_SUPABASE_URL}/storage/v1/object/${PHOTO_BUCKET}/${path}`,{
    method:"POST",
    headers:photoAuthHeaders({"Content-Type":file.type,"x-upsert":"false"}),
    body:file
  });
  if(!r.ok) throw new Error(await r.text());
  return `${PHOTO_SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${path}`;
}

async function salvarManutencaoComFotos(o,eq,fotos){
  const campos={};
  Object.keys(o).filter(k=>/^campo\d+$/.test(k)).forEach(k=>campos[k]=o[k]||"");
  const ed=contextoEdicaoPOP();
  const editando=!!(ed?.manutencao_id&&Number(ed.equipamento_id)===Number(eq.id));
  const payload={equipamento_id:eq.id||null,tipo:o.tipo||null,codigo:eq.codigo||null,cliente:eq.cliente||null,unidade:eq.unidade||null,municipio:eq.municipio||null,localizacao:eq.localizacao||eq.local||null,data:o.data||null,tecnico:o.tecnico||null,checks:o.checks||[],campos,observacoes:o.observacoes||null,foto_antes:fotos.antes||(editando?ed.foto_antes:null)||null,foto_durante:fotos.durante||(editando?ed.foto_durante:null)||null,foto_depois:fotos.depois||(editando?ed.foto_depois:null)||null};
  const url=editando?`${PHOTO_SUPABASE_URL}/rest/v1/manutencoes?id=eq.${Number(ed.manutencao_id)}`:`${PHOTO_SUPABASE_URL}/rest/v1/manutencoes`;
  const r=await fetch(url,{method:editando?"PATCH":"POST",headers:photoAuthHeaders({"Content-Type":"application/json",Prefer:"return=representation"}),body:JSON.stringify(payload)});
  if(!r.ok) throw new Error(await r.text());
  return (await r.json())[0];
}

function prepararFotosManutencao(){
  document.querySelectorAll(".manutForm").forEach(f=>{
    if(f.dataset.fotosPreparadas==='1')return;
    f.dataset.fotosPreparadas='1';
    const fileInputs=f.querySelectorAll('input[type="file"]');
    if(fileInputs[0]) fileInputs[0].dataset.etapa="antes";
    if(fileInputs[1]) fileInputs[1].dataset.etapa="durante";
    if(fileInputs[2]) fileInputs[2].dataset.etapa="depois";
    f.addEventListener("submit",async ev=>{
      ev.preventDefault();ev.stopImmediatePropagation();
      const sel=f.querySelector(".equipSelect"),box=f.querySelector(".equipAuto"),idx=Number(sel.value),eq=eqs()[idx];
      if(!eq)return alert("Selecione um equipamento.");
      const edAntes=contextoEdicaoPOP();
      const editando=!!(edAntes?.manutencao_id&&Number(edAntes.equipamento_id)===Number(eq.id));
      const fd=new FormData(f),o={tipo:f.dataset.tipo,equip_index:idx,codigo:eq.codigo,cliente:eq.cliente,unidade:eq.unidade,municipio:eq.municipio,local:eq.localizacao||eq.local,criado:new Date().toLocaleString("pt-BR")};
      for(const [k,v] of fd.entries())if(!(v instanceof File))o[k]=v;
      o.checks=[...f.querySelectorAll('input[type="checkbox"]')].map(x=>x.checked);
      const btn=f.querySelector("button.primary");
      try{
        if(btn){btn.disabled=true;btn.textContent=editando?"Salvando alterações...":"Sincronizando fotos e salvando...";}
        const fotos={};
        for(const inp of [...f.querySelectorAll('input[type="file"]')]){
          let url=inp.dataset.cloudUrl||null;
          if(window.NAP_PHOTO_AUTOSAVE?.ensureUploaded){
            try{url=await window.NAP_PHOTO_AUTOSAVE.ensureUploaded(inp,eq.codigo)||url;}catch(e){console.warn('Falha ao sincronizar rascunho da foto',e);}
          }
          const file=inp.files?.[0];
          if(!url&&file)url=await uploadFotoManutencao(file,eq.codigo,inp.dataset.etapa);
          if(url)fotos[inp.dataset.etapa]=url;
        }
        const salvo=await salvarManutencaoComFotos(o,eq,fotos);
        const a=db.get("manut");
        if(editando){const i=a.findIndex(x=>Number(x.id)===Number(salvo.id));if(i>=0)a[i]={...a[i],...o,...salvo};else a.push({...o,...salvo});}
        else a.push({...o,...salvo});
        db.set("manut",a);
        if(window.clienteFichaCache?.manut){const i=clienteFichaCache.manut.findIndex(x=>Number(x.id)===Number(salvo.id));if(i>=0)clienteFichaCache.manut[i]={...clienteFichaCache.manut[i],...o,...salvo};else clienteFichaCache.manut.unshift({...o,...salvo});}
        if(window.NAP_PHOTO_AUTOSAVE?.clearForm)try{await window.NAP_PHOTO_AUTOSAVE.clearForm(f);}catch(_){ }
        if(editando){
          try{if(typeof cloudHistorico!=='undefined'){cloudHistorico.manut=cloudHistorico.manut||[];const i=cloudHistorico.manut.findIndex(x=>Number(x.id)===Number(salvo.id));if(i>=0)cloudHistorico.manut[i]=salvo;else cloudHistorico.manut.unshift(salvo);}}catch(_){ }
          sessionStorage.removeItem('napricelo_pop_edicao');
          alert("Alterações salvas na execução original. Nenhuma nova execução foi criada.");
          f.reset();box.textContent="Selecione o equipamento.";
          if(typeof carregarAgendaComercial==='function')try{await carregarAgendaComercial()}catch(_){ }
          if(typeof executarAgendaComercial==='function'&&edAntes?.agenda_id){showPage("home");setTimeout(()=>executarAgendaComercial(edAntes.agenda_id),180);}else showPage("home");
        }else{
          let finalizouOS=false;
          if(typeof window.finalizarPopOSComRegistro==='function'){
            try{finalizouOS=await window.finalizarPopOSComRegistro(eq,salvo);}catch(e){console.error('Falha ao finalizar OS após POP com fotos',e);}
          }
          if(!finalizouOS)alert(Object.keys(fotos).length?"Manutenção e fotos salvas na nuvem.":"Manutenção salva na nuvem.");
          f.reset();box.textContent="Selecione o equipamento.";showPage("home");
        }
      }catch(err){console.error(err);alert(editando?"Não foi possível salvar as alterações da execução. Verifique a sessão e a internet e tente novamente.":"Não foi possível salvar a manutenção. As fotos capturadas permanecem protegidas no aparelho e serão sincronizadas quando a conexão voltar.");}
      finally{if(btn){btn.disabled=false;btn.textContent=editando?"Salvar alterações da execução":"Salvar manutenção";}}
    },true);
  });
}
prepararFotosManutencao();