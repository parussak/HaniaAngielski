import {readFile,readdir,lstat,mkdir,mkdtemp,copyFile,utimes,writeFile,rename,rm} from 'node:fs/promises';
import {resolve,relative,join,dirname,isAbsolute} from 'node:path';
import {canonical,hash} from './plan.mjs';
import {inspectOpus} from './ogg.mjs';

const clipPath=id=>`clips/${id}.ogg`;
const validId=id=>/^[a-f0-9]{64}$/.test(id);
export function inside(root,path){const part=relative(resolve(root),resolve(path));if(!part||isAbsolute(part)||part==='..'||part.startsWith('..\\')||part.startsWith('../'))throw Error('Audio: ścieżka poza katalogiem generatora.');return resolve(path);}
async function exists(path){try{return await lstat(path);}catch(e){if(e.code==='ENOENT')return null;throw e;}}
async function realDirectory(path){const stat=await exists(path);if(stat&&(stat.isSymbolicLink()||!stat.isDirectory()))throw Error(`Audio: katalog nie może być dowiązaniem ani plikiem: ${path}`);}
async function readOwned(output){
 await realDirectory(output);if(!await exists(output))return null;
 const manifestPath=join(output,'manifest.json'),stat=await exists(manifestPath);if(!stat||stat.isSymbolicLink()||!stat.isFile())throw Error('Audio: istniejący katalog nie ma manifestu generatora. Niczego nie usunięto.');
 let manifest;try{manifest=JSON.parse(await readFile(manifestPath,'utf8'));}catch{throw Error('Audio: nieczytelny manifest; przywróć go z repozytorium.');}
 if(manifest?.version!==1||!manifest.clips||typeof manifest.clips!=='object'||Array.isArray(manifest.clips)||!Object.entries(manifest.clips).every(([id,c])=>validId(id)&&c?.file===clipPath(id)))throw Error('Audio: niepoprawny manifest; niczego nie usunięto.');
 for(const entry of await readdir(output,{withFileTypes:true}))if(entry.name!=='manifest.json'&&entry.name!=='clips')throw Error(`Audio: nieznany plik w katalogu wyników: ${entry.name}. Niczego nie usunięto.`);
 const dir=join(output,'clips');await realDirectory(dir);
 if(await exists(dir))for(const entry of await readdir(dir,{withFileTypes:true})){
  if(!entry.isFile()||entry.isSymbolicLink()||!Object.values(manifest.clips).some(c=>c.file===`clips/${entry.name}`))throw Error(`Audio: osierocony lub nieznany plik: ${entry.name}. Niczego nie usunięto.`);
 }
 return manifest;
}
async function validClip(output,id,meta){
 if(!meta||meta.file!==clipPath(id))return false;
 try{const bytes=await readFile(join(output,clipPath(id)));const measured=inspectOpus(bytes);return bytes.length===meta.bytes&&hash(bytes)===meta.sha256&&canonical(measured)===canonical(meta.audio);}catch(e){if(e.code&&e.code!=='ENOENT')throw e;return false;}
}
export async function checkGenerated(plan,output){
 const manifest=await readOwned(output);if(!manifest)throw Error('Audio: brak nagrań. Uruchom npm run audio.');
 const {clips,...header}=manifest;
 if(canonical(header)!==canonical(plan.header)||canonical(Object.keys(clips).sort())!==canonical(plan.clips.map(c=>c.id).sort()))throw Error('Audio: nagrania nie odpowiadają aktualnym treściom lub ustawieniom. Uruchom npm run audio.');
 for(const clip of plan.clips)if(!await validClip(output,clip.id,clips[clip.id]))throw Error(`Audio: brak lub uszkodzone nagranie ${clip.id}. Uruchom npm run audio.`);
 return {clips:plan.clips.length,bytes:Object.values(clips).reduce((n,c)=>n+c.bytes,0),references:plan.header.modules.reduce((n,m)=>n+m.references.length,0)};
}
/** Prepare everything before a directory swap. Engine failures keep the previous set intact. */
export async function generateFiles(plan,output,{synthesize,encode,log=()=>{}}){
 output=resolve(output);const parent=dirname(output);await realDirectory(parent);await mkdir(parent,{recursive:true});
 const previous=await readOwned(output),reusable=new Set();
 for(const c of plan.clips)if(previous&&await validClip(output,c.id,previous.clips[c.id]))reusable.add(c.id);
 if(previous&&reusable.size===plan.clips.length&&canonical(previous)===canonical({...plan.header,clips:Object.fromEntries(plan.clips.map(c=>[c.id,previous.clips[c.id]]))}))return {...await checkGenerated(plan,output),generated:0,reused:reusable.size,removed:0};
 const work=await mkdtemp(join(parent,'.audio-tmp-'));inside(parent,work);
 const staged=join(work,'generated'),backup=join(work,'previous'),wavs=join(work,'wav');await mkdir(join(staged,'clips'),{recursive:true});await mkdir(wavs);
 let movedOld=false,installed=false;
 try{
  const missing=plan.clips.filter(c=>!reusable.has(c.id)).map(c=>({...c,wav:join(wavs,`${c.id}.wav`)}));
  if(missing.length){log(`Synteza: ${missing.length} nowych lub zmienionych klipów.`);await synthesize(missing);}
  const clips={};let completed=0;
  for(const c of plan.clips){
   const target=join(staged,clipPath(c.id));
   if(reusable.has(c.id)){const source=join(output,clipPath(c.id));await copyFile(source,target);const stat=await lstat(source);await utimes(target,stat.atime,stat.mtime);clips[c.id]=previous.clips[c.id];}
   else {await encode(missing.find(v=>v.id===c.id),target);const bytes=await readFile(target);clips[c.id]={file:clipPath(c.id),bytes:bytes.length,sha256:hash(bytes),audio:inspectOpus(bytes)};completed++;if(completed%10===0)log(`Zapisano Opus: ${completed}/${missing.length}.`);}
  }
  await writeFile(join(staged,'manifest.json'),JSON.stringify({...plan.header,clips},null,2)+'\n');await checkGenerated(plan,staged);
  if(previous){inside(parent,output);await rename(output,backup);movedOld=true;}
  try{await rename(staged,output);installed=true;}catch(error){if(movedOld){await rename(backup,output);movedOld=false;}throw error;}
  return {...await checkGenerated(plan,output),generated:missing.length,reused:reusable.size,removed:Object.keys(previous?.clips??{}).filter(id=>!clips[id]).length};
 }finally{
  // If restoration itself failed, retain the backup for recovery rather than erase it.
  if(!movedOld||installed){inside(parent,work);await rm(work,{recursive:true,force:true});}
 }
}
