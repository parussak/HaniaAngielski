// npm run audio:verify — lokalna kontrola brzmienia nagrań (Whisper + pomiary).
// Tylko czyta audio/generated/. Wyniki i pamięć podręczna: audio/.verify/ (poza Git).
import {readFile,writeFile,mkdir,mkdtemp,rm,stat,copyFile} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {tmpdir,availableParallelism} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {inside} from './files.mjs';
import {analyzeSamples,assessClips,formatReport,listeningFiles,listeningPage,readWhisperJson,wavFile} from './verify-core.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url)),audio=join(root,'audio'),generated=join(audio,'generated'),work=join(audio,'.verify');
const rate=16000,padding=new Int16Array(rate*0.3);

function run(exe,args,binary=false){
 const result=spawnSync(exe,args,{cwd:dirname(exe),windowsHide:true,shell:false,timeout:900000,maxBuffer:64*1024*1024,encoding:binary?'buffer':'utf8'});
 if(result.error||result.status!==0)throw Error(`Kontrola audio: ${result.error?.message??String(result.stderr).slice(-2000)}`);
 return result.stdout;
}
async function verifyTool(toolsRoot,spec){
 const path=inside(toolsRoot,join(toolsRoot,spec.file));
 try{const s=await stat(path);if(!s.isFile())throw Error('nie jest plikiem');const h=createHash('sha256');for await(const chunk of createReadStream(path))h.update(chunk);if(h.digest('hex')!==spec.sha256)throw Error('niezgodna suma SHA-256');}
 catch(error){throw Error(`Kontrola audio: ${spec.file}: ${error.message}. Instalacja: docs/generowanie-audio.md, sekcja „Kontrola brzmienia”.`);}
 return path;
}
async function readJson(path,fallback){try{return JSON.parse(await readFile(path,'utf8'));}catch(e){if(e.code==='ENOENT')return fallback;throw e;}}

async function main(){
 const args=process.argv.slice(2);let toolsOption,recognition=true,fresh=false;
 for(let i=0;i<args.length;i++){
  if(args[i]==='--tools'&&args[i+1])toolsOption=args[++i];
  else if(args[i]==='--bez-rozpoznawania')recognition=false;
  else if(args[i]==='--od-nowa')fresh=true;
  else throw Error(`Kontrola audio: nieznana opcja ${args[i]}. Dostępne: --tools ścieżka, --bez-rozpoznawania, --od-nowa.`);
 }
 const config=JSON.parse(await readFile(join(audio,'config.json'),'utf8')),verify=JSON.parse(await readFile(join(audio,'verify.json'),'utf8'));
 const manifest=await readJson(join(generated,'manifest.json'));
 if(!manifest)throw Error('Kontrola audio: brak audio/generated/manifest.json. Uruchom najpierw npm run audio.');

 // Tekst każdego klipu pochodzi z manifestu generatora: identyczne teksty mają jeden klip i wiele odwołań.
 const byClip=new Map();
 for(const m of manifest.modules)for(const r of m.references){
  const c=byClip.get(r.clip)??{id:r.clip,text:r.text,language:m.language,keys:[],file:`audio/generated/${manifest.clips[r.clip].file}`};
  c.keys.push(r.key);byClip.set(r.clip,c);
 }
 const clips=[...byClip.values()],skipped=clips.filter(c=>c.language.split(/[-_]/)[0]!==verify.model.language);
 const checked=clips.filter(c=>!skipped.includes(c));

 const toolsRoot=resolve(root,toolsOption??process.env.MALE_KROKI_AUDIO_TOOLS??config.defaultToolsDirectory);
 const ffmpeg=await verifyTool(toolsRoot,config.tools.ffmpeg);
 const whisper=recognition?await verifyTool(toolsRoot,verify.whisper):null,model=recognition?await verifyTool(toolsRoot,verify.model):null;

 await mkdir(work,{recursive:true});
 const cachePath=join(work,'cache.json'),cache=fresh?{}:await readJson(cachePath,{}),cacheKey=id=>`${verify.model.sha256.slice(0,16)}:${id}`;
 const temp=await mkdtemp(join(tmpdir(),'male-kroki-verify-'));
 try{
  const pending=[];
  for(const clip of checked){
   const samples=new Int16Array(new Uint8Array(run(ffmpeg,['-hide_banner','-loglevel','error','-i',join(root,clip.file),'-ac','1','-ar',String(rate),'-f','s16le','-'],true)).buffer);
   clip.measurements=analyzeSamples(samples,rate);
   if(!recognition)continue;
   const hit=cache[cacheKey(clip.id)];
   if(hit){clip.heard=hit.heard;clip.confidence=hit.confidence;continue;}
   // Krótka cisza na brzegach pomaga Whisperowi przy pojedynczych słowach.
   const padded=new Int16Array(padding.length*2+samples.length);padded.set(samples,padding.length);
   const wav=join(temp,`${clip.id}.wav`);await writeFile(wav,wavFile(padded,rate));pending.push({clip,wav});
  }
  if(pending.length)console.log(`Rozpoznawanie mowy: ${pending.length} nowych klipów (pozostałe z pamięci podręcznej)…`);
  const threads=String(Math.max(1,Math.min(8,availableParallelism()-1)));
  for(let i=0;i<pending.length;i+=40){
   const batch=pending.slice(i,i+40);
   // Bez podpowiedzi (prompt): Whisper ma usłyszeć nagranie, a nie zgadywać oczekiwany tekst.
   run(whisper,['-m',model,'-l',verify.model.language,'-t',threads,'-np','-ojf','--suppress-nst',...batch.flatMap(p=>['-f',p.wav])]);
   for(const {clip,wav} of batch){
    const result=readWhisperJson(JSON.parse(await readFile(`${wav}.json`,'utf8')));
    clip.heard=result.heard;clip.confidence=result.confidence;cache[cacheKey(clip.id)]=result;
   }
   await writeFile(cachePath,JSON.stringify(cache,null,1)+'\n');
  }
 }finally{await rm(temp,{recursive:true,force:true});}

 const assessed=assessClips(checked),report=formatReport(assessed,{model:verify.model.name,recognition})+(skipped.length?`\nPominięto ${skipped.length} klipów w języku innym niż ${verify.model.language} (brak modelu).\n`:'');
 await writeFile(join(work,'raport.md'),report);
 // Kopie z czytelnymi nazwami; katalog odsluch/ należy tylko do tego skryptu i jest odtwarzany przy każdym uruchomieniu.
 const listening=join(work,'odsluch'),files=listeningFiles(assessed);
 await rm(listening,{recursive:true,force:true});await mkdir(listening);
 for(const f of files)await copyFile(join(root,f.clip.file),join(listening,f.name));
 await writeFile(join(listening,'index.html'),listeningPage(files));
 console.log(report);
 console.log('Raport zapisany: audio/.verify/raport.md. Odsłuch: audio/.verify/odsluch/index.html');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
