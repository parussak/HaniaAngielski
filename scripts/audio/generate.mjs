import {readFile,open,rm,stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readLibrary} from '../../src/materials/library.ts';
import {createPlan,validateConfig} from './plan.mjs';
import {generateFiles,checkGenerated,inside} from './files.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url)),audio=join(root,'audio'),output=join(audio,'generated');
function run(exe,args,input){
 const result=spawnSync(exe,args,{cwd:dirname(exe),input,encoding:'utf8',windowsHide:true,shell:false,timeout:300000,maxBuffer:4*1024*1024});
 if(result.error||result.status!==0)throw Error(`Audio: ${result.error?.message??result.stderr?.slice(-3000)??'Błąd narzędzia'}`);
}
async function verifyTool(toolsRoot,file){
 const path=inside(toolsRoot,join(toolsRoot,file.file));
 try{const s=await stat(path);if(!s.isFile())throw Error('nie jest plikiem');const hash=createHash('sha256');for await(const chunk of createReadStream(path))hash.update(chunk);if(hash.digest('hex')!==file.sha256)throw Error('niezgodna suma SHA-256');}
 catch(error){throw Error(`Audio: ${file.file}: ${error.message}. Sprawdź katalog narzędzi i audio/config.json. Niczego nie pobrano.`);}return path;
}
async function main(){
 const args=process.argv.slice(2);let check=false,preview=false,toolsOption;
 for(let i=0;i<args.length;i++){if(args[i]==='--check')check=true;else if(args[i]==='--plan')preview=true;else if(args[i]==='--tools'&&args[i+1])toolsOption=args[++i];else throw Error(`Audio: nieznana opcja ${args[i]}. Dostępne: --check, --plan, --tools ścieżka.`);}
 if(check&&preview)throw Error('Audio: wybierz --check albo --plan.');
 const config=validateConfig(JSON.parse(await readFile(join(audio,'config.json'),'utf8')));
 const {modules}=await readLibrary(async path=>JSON.parse(await readFile(join(root,'public/content',path),'utf8'))),plan=createPlan(modules,config);
 if(preview){console.log(JSON.stringify({modules:plan.header.modules.map(m=>({id:m.moduleId,references:m.references.length})),uniqueClips:plan.clips.length,profiles:plan.header.profiles},null,2));return;}
 const lockPath=join(audio,'.generator.lock');let lock;
 try{lock=await open(lockPath,'wx');}catch(e){if(e.code==='EEXIST')throw Error('Audio: generator jest już uruchomiony (audio/.generator.lock). Jeśli poprzedni proces zakończył się awarią, sprawdź, czy nie pracuje, i usuń tylko ten plik blokady.');throw e;}
 try{
  await lock.writeFile(JSON.stringify({pid:process.pid}));
  if(check){const result=await checkGenerated(plan,output);console.log(`Audio OK: ${result.references} odwołań, ${result.clips} klipów, ${result.bytes} bajtów. Aplikacja nadal używa syntezy przeglądarki.`);return;}
  const toolsRoot=resolve(root,toolsOption??process.env.MALE_KROKI_AUDIO_TOOLS??config.defaultToolsDirectory);
  const piper=await verifyTool(toolsRoot,config.tools.piper),ffmpeg=await verifyTool(toolsRoot,config.tools.ffmpeg),profiles={};
  for(const id of Object.keys(plan.header.profiles)){
   const profile=config.profiles[id];profiles[id]={model:await verifyTool(toolsRoot,profile.model),config:await verifyTool(toolsRoot,profile.modelConfig)};
   const language=JSON.parse(await readFile(profiles[id].config,'utf8')).language?.code;
   if(typeof language!=='string'||language.toLowerCase().split(/[-_]/)[0]!==profile.language.toLowerCase().split(/[-_]/)[0])throw Error(`Audio: język modelu nie pasuje do profilu ${id}.`);
  }
  const result=await generateFiles(plan,output,{
   log:console.log,
   synthesize:async tasks=>{
    for(const id of new Set(tasks.map(t=>t.profile))){const p=config.profiles[id],files=profiles[id];run(piper,['--model',files.model,'--config',files.config,'--json-input','--length_scale',String(p.inference.lengthScale),'--sentence_silence',String(p.inference.sentenceSilence)],tasks.filter(t=>t.profile===id).map(t=>JSON.stringify({text:t.text,output_file:t.wav})).join('\n')+'\n');}
   },
   encode:async(task,target)=>{
    const {encoding:e,processing:f}=config.profiles[task.profile];
    const trim=`silenceremove=start_periods=1:start_threshold=${f.silenceThresholdDb}dB:start_silence=${f.startSilence},areverse,silenceremove=start_periods=1:start_threshold=${f.silenceThresholdDb}dB:start_silence=${f.endSilence},areverse`;
    run(ffmpeg,['-y','-hide_banner','-loglevel','error','-i',task.wav,'-map_metadata','-1','-af',`${trim},loudnorm=I=${f.loudness}:TP=${f.truePeak}:LRA=${f.loudnessRange}`,'-ac',String(e.channels),'-ar',String(e.sampleRate),'-c:a',e.codec,'-b:a',String(e.bitrate),'-application',e.application,target]);
   }
  });
  console.log(`Audio gotowe: ${result.generated} wygenerowanych, ${result.reused} zachowanych, ${result.removed} nieużywanych usuniętych. ${result.clips} klipów / ${result.references} odwołań / ${(result.bytes/1024).toFixed(1)} KiB.`);
  console.log('Pliki: audio/generated. Bez zmian w odtwarzaniu aplikacji i paczce PWA.');
 }finally{await lock.close();await rm(lockPath,{force:true});}
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
