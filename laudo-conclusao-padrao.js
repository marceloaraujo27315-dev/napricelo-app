(()=>{
'use strict';
const TEXTOS={
  napricelo:'Com base na vistoria técnica realizada e nas condições observadas no momento da inspeção, conclui-se que o Biodigestor Napricelo encontra-se instalado de forma compatível com sua finalidade de tratamento de efluentes sanitários, apresentando posicionamento, interligações hidráulicas, acessos para inspeção e manutenção e direcionamento do efluente conforme a configuração prevista para o sistema. Não foram observadas, no escopo da vistoria, condições aparentes que impeçam sua operação, estando a instalação compatível com os parâmetros técnicos aplicáveis ao sistema avaliado. Recomenda-se manter o uso adequado da rede sanitária, as inspeções periódicas, a manutenção preventiva e o atendimento às recomendações técnicas registradas neste laudo.',
  ecobio:'Com base na vistoria técnica realizada e nas condições observadas no momento da inspeção, conclui-se que o Ecobio Reator Napricelo encontra-se instalado de forma compatível com sua finalidade de tratamento de efluentes sanitários, com condições aparentes adequadas de posicionamento, interligações hidráulicas, acessos para inspeção e manutenção e encaminhamento do efluente para a destinação final complementar prevista. Não foram observadas, no escopo da vistoria, condições aparentes que impeçam sua operação, estando a instalação compatível com os parâmetros técnicos aplicáveis ao sistema avaliado. Recomenda-se manter as orientações de uso, inspeção periódica, manutenção preventiva e as demais recomendações técnicas registradas neste laudo.',
  terceiro:'Com base na vistoria técnica realizada e nas condições observadas no momento da inspeção, conclui-se que o biodigestor avaliado encontra-se instalado de forma compatível com sua finalidade de tratamento de efluentes sanitários, apresentando condições aparentes adequadas de posicionamento, interligações hidráulicas, acessos para inspeção e manutenção e direcionamento do efluente conforme a configuração observada em campo. Não foram observadas, no escopo da vistoria, condições aparentes que impeçam sua operação. Recomenda-se manter as orientações do fabricante, o uso adequado da rede sanitária, as inspeções periódicas, a manutenção preventiva e o atendimento às recomendações técnicas registradas neste laudo.'
};
function aplicar(){
  const f=document.getElementById('laudoBioForm'); if(!f) return false;
  const campo=f.elements.conclusao, tipo=f.elements.sistema_tipo; if(!campo||!tipo) return false;
  const preencher=()=>{
    const novo=TEXTOS[tipo.value]||TEXTOS.terceiro;
    const anteriores=Object.values(TEXTOS);
    if(!campo.value.trim()||anteriores.includes(campo.value.trim())) campo.value=novo;
  };
  preencher();
  if(!tipo.dataset.conclusaoPadrao){tipo.dataset.conclusaoPadrao='1';tipo.addEventListener('change',preencher);}
  return true;
}
function iniciar(){if(aplicar())return;const o=new MutationObserver(()=>{if(aplicar())o.disconnect();});o.observe(document.body,{childList:true,subtree:true});}
iniciar();
})();
