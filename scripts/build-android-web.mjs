import { cp, mkdir, readdir, rm, stat, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const out=path.join(root,'www');
const ignorar=new Set(['www','android','node_modules','.git','.github','scripts']);
const extensoes=new Set(['.html','.css','.js','.json','.svg','.png','.jpg','.jpeg','.webp','.ico']);

await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});

for(const nome of await readdir(root)){
  if(ignorar.has(nome))continue;
  const origem=path.join(root,nome);
  const st=await stat(origem);
  if(st.isDirectory())continue;
  if(!extensoes.has(path.extname(nome).toLowerCase()))continue;
  await cp(origem,path.join(out,nome));
}

// No Android/Capacitor não há injeção do service worker da versão web.
// Portanto, scripts de correção que precisam existir no app nativo são
// incluídos diretamente no index empacotado.
const indexPath=path.join(out,'index.html');
let html=await readFile(indexPath,'utf8');
const scriptsAndroid=[
  'ete-prodoeste.js',
  'ete-analises.js',
  'responsaveis-campo-dinamicos.js',
  'venda-instalacao-os-fix.js',
  'os-instalacao-route-hotfix.js',
  'android-localizacao-nativa.js',
  'registro-avancado-campo.js'
];
for(const s of scriptsAndroid){
  if(!html.includes(s))html=html.replace('</body>',`<script src="${s}?android=1"></script></body>`);
}
await writeFile(indexPath,html,'utf8');

console.log('Arquivos web preparados em www/ para o Capacitor, com correções Android incluídas.');
