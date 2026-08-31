import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const out=path.join(root,'www');
const ignorar=new Set(['www','android','node_modules','.git','.github','scripts']);
const extensoes=new Set(['.html','.css','.js','.json','.svg','.png','.jpg','.jpeg','.webp','.ico','.pdf']);

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

console.log('Arquivos web preparados em www/ para o Capacitor.');
