(()=>{
'use strict';
const OLD='.ass{margin-top:45px;text-align:center;position:relative;border-top:1px solid #555;padding-top:5px}.lb-asscrop{width:54mm;height:18mm;overflow:hidden;position:absolute;left:50%;transform:translateX(-50%);bottom:11mm}.lb-asscrop img{width:108mm;max-width:none}.lb-asscrop.dir img{transform:translateX(-54mm)}';
const NOVO='.ass{margin-top:40px;text-align:center;position:relative;padding-top:24mm;break-inside:avoid}.ass::before{content:"";position:absolute;top:19mm;left:50%;transform:translateX(-50%);width:75mm;border-top:1px solid #555}.lb-asscrop{width:54mm;height:18mm;overflow:hidden;position:absolute;left:50%;transform:translateX(-50%);top:0}.lb-asscrop img{width:108mm;max-width:none}.lb-asscrop.dir img{transform:translateX(-54mm)}.ass b{display:inline-block;margin-top:2mm}';
function aplicar(){
  const api=window.LaudoBio;
  if(!api||typeof api.gerar!=='function'||api.gerar.__assinaturaFix)return false;
  const base=api.gerar;
  api.gerar=function(){
    const abrir=window.open;
    window.open=function(){
      const w=abrir.apply(window,arguments);
      if(!w)return w;
      try{
        const write=w.document.write.bind(w.document);
        w.document.write=function(html){
          try{
            let s=String(html??'');
            if(s.includes(OLD)) s=s.replace(OLD,NOVO);
            else s=s.replace(/\.ass\{margin-top:45px;text-align:center;position:relative;border-top:1px solid #555;padding-top:5px\}\.lb-asscrop\{width:54mm;height:18mm;overflow:hidden;position:absolute;left:50%;transform:translateX\(-50%\);bottom:11mm\}/, '.ass{margin-top:40px;text-align:center;position:relative;padding-top:24mm;break-inside:avoid}.ass::before{content:"";position:absolute;top:19mm;left:50%;transform:translateX(-50%);width:75mm;border-top:1px solid #555}.lb-asscrop{width:54mm;height:18mm;overflow:hidden;position:absolute;left:50%;transform:translateX(-50%);top:0}');
            return write(s);
          }catch(e){console.warn('Falha ao ajustar assinatura do laudo',e);return write(html);}
        };
      }catch(e){console.warn(e);}
      return w;
    };
    try{return base.apply(this,arguments)}finally{window.open=abrir;}
  };
  api.gerar.__assinaturaFix=true;
  return true;
}
if(!aplicar()){
  const t=setInterval(()=>{if(aplicar())clearInterval(t)},250);
  setTimeout(()=>clearInterval(t),15000);
}
})();