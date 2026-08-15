async function salvarEquipamentoNuvem(o){
  const clienteId=o.cliente_id?Number(o.cliente_id):null;
  const unidadeId=o.unidade_id?Number(o.unidade_id):null;
  const payload={
    cliente_id:clienteId,
    unidade_id:unidadeId,
    codigo:o.codigo||null,
    cliente:o.cliente||null,
    unidade:o.unidade||null,
    municipio:o.municipio||null,
    tipo:o.tipo||null,
    modelo:o.modelo||null,
    capacidade:o.capacidade||null,
    localizacao:o.localizacao||o.local||null,
    observacoes:o.observacoes||o.obs||null
  };
  const r=await fetch(`${SUPABASE_URL}/rest/v1/equipamentos`,{
    method:"POST",
    headers:{...SUPABASE_HEADERS,Prefer:"return=representation"},
    body:JSON.stringify(payload)
  });
  if(!r.ok)throw new Error(await r.text());
  return (await r.json())[0];
}
function nomeClienteVinculado(eq){if(eq.cliente_id&&typeof clientesCache!=="undefined"){const c=clientesCache.find(x=>Number(x.id)===Number(eq.cliente_id));if(c)return c.nome;}return eq.cliente||"";}
function nomeUnidadeVinculada(eq){if(eq.unidade_id&&typeof unidadesCache!=="undefined"){const u=unidadesCache.find(x=>Number(x.id)===Number(eq.unidade_id));if(u)return u.nome;}return eq.unidade||"";}
function addCss(href){if(!document.querySelector(`link[href="${href}"]`)){const l=document.createElement("link");l.rel="stylesheet";l.href=href;document.head.appendChild(l);}}
function addScript(src,onload){const existente=document.querySelector(`script[src="${src}"]`);if(existente){if(onload)onload();return;}const s=document.createElement("script");s.src=src;if(onload)s.onload=onload;document.body.appendChild(s);}
(function carregarProntuarios(){addCss("cliente-ficha.css");addCss("equipamento-ficha.css");addScript("cliente-ficha.js",()=>addScript("equipamento-ficha.js"));})();
