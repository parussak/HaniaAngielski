import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mkdtemp,rm,readFile,writeFile,readdir,stat,utimes} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createPlan,canonical,validateConfig} from '../scripts/audio/plan.mjs';
import {generateFiles,checkGenerated,inside} from '../scripts/audio/files.mjs';
import {inspectOpus,oggCRC} from '../scripts/audio/ogg.mjs';
import {sceneModule} from './fixtures/scenes.ts';
import {foodModules} from './materials.ts';
const template=JSON.parse(readFileSync(new URL('../audio/config.json',import.meta.url),'utf8'));
function material(){const m=sceneModule();m.languageCode='en';m.words=m.words.slice(0,2);m.words[0]={id:'apple',front:'jabłko',back:'apple',article:{expected:'an',explanation:'Jedno jabłko.'}};return m;}
function config(id='scene-unit'){const c=structuredClone(template);c.modules=[{id,profile:'cori'}];return c;}
// Synthetic Ogg pages for testing container/integrity handling, not the quality of speech.
function page(payload:Buffer,seq:number,flags:number,granule:bigint){const b=Buffer.alloc(28+payload.length);b.write('OggS');b[5]=flags;b.writeBigUInt64LE(granule,6);b.writeUInt32LE(7,14);b.writeUInt32LE(seq,18);b[26]=1;b[27]=payload.length;payload.copy(b,28);b.writeUInt32LE(oggCRC(b),22);return b;}
function opus(channels=1){const head=Buffer.alloc(19);head.write('OpusHead');head[8]=1;head[9]=channels;head.writeUInt16LE(312,10);head.writeUInt32LE(24000,12);return Buffer.concat([page(head,0,2,0n),page(Buffer.from([0xf8,0xff,0xfe]),1,4,24312n)]);}
async function directory(t:any){const root=await mkdtemp(join(tmpdir(),'male-kroki-audio-test-'));inside(tmpdir(),root);t.after(()=>rm(root,{recursive:true,force:true}));return join(root,'generated');}
function renderer(){const count={synth:0,encoded:0},ports={synthesize:async(tasks:any[])=>{count.synth+=tasks.length;},encode:async(_task:any,path:string)=>{count.encoded++;await writeFile(path,opus());}};return {count,ports};}

test('audio: plan korzysta z pełnych haseł z a/an i uzupełnia także dwie luki w jednej kwestii',()=>{
 const m=material(),before=structuredClone(m),plan=createPlan([m],config());
 const refs=plan.header.modules[0].references;assert.equal(refs.find((r:any)=>r.kind==='word'&&r.key.endsWith(':apple')).text,'an apple');
 assert.ok(refs.some((r:any)=>r.text==='Beta duo and gamma trio.'));assert.ok(refs.every((r:any)=>!r.text.includes('___')));assert.deepEqual(m,before);
 // The old one-gap dialogues and grammar explanations are not recorded in this stage.
 assert.ok(refs.every((r:any)=>r.kind==='word'||r.kind==='scene-line'));
});

test('audio: identyczny tekst współdzieli klip, a tłumaczenie i kolejność JSON nie zmieniają nazwy',()=>{
 const m=material();m.words.push({...m.words[0],id:'second-apple'});const c=config(),p=createPlan([m],c),refs=p.header.modules[0].references.filter((r:any)=>r.kind==='word'&&r.text==='an apple');assert.equal(refs.length,2);assert.equal(refs[0].clip,refs[1].clip);
 m.words[0].front='Inne objaśnienie';m.words.reverse();const changed=createPlan([m],c);assert.equal(canonical(p),canonical(changed));
 const n=structuredClone(c);n.profiles.cori.encoding={...n.profiles.cori.encoding,bitrate:c.profiles.cori.encoding.bitrate===24000?16000:24000};assert.notEqual(createPlan([m],n).clips[0].id,p.clips[0].id);
 n.profiles.cori.encoding=c.profiles.cori.encoding;n.profiles.cori.inference.lengthScale=1.1;assert.notEqual(createPlan([m],n).clips[0].id,p.clips[0].id);
});

test('audio: zmiana jednego hasła zmienia tylko jego klip, głos innego języka i złe parametry są odrzucane',()=>{
 const m=material(),c=config(),p=createPlan([m],c);m.words[0].back='pear';const updated=createPlan([m],c);assert.equal(updated.clips.filter((v:any)=>!p.clips.some((x:any)=>x.id===v.id)).length,1);
 m.languageCode='fr';assert.throws(()=>createPlan([m],c),/języka/);assert.throws(()=>createPlan([m],config('missing')),/brak modułu/);
 for(const mutate of [(v:any)=>v.profiles.cori.encoding.channels=2,(v:any)=>v.tools.piper.file='../outside.exe',(v:any)=>v.profiles.cori.language=undefined,(v:any)=>v.profiles.cori.processing.loudness=NaN]){const bad=config();mutate(bad);assert.throws(()=>validateConfig(bad));}
});

test('audio: kontrola Ogg sprawdza Opus mono, sumy stron, częstotliwość i zamknięcie strumienia',()=>{
 assert.deepEqual(inspectOpus(opus()),{codec:'opus',channels:1,inputSampleRate:24000,durationSeconds:0.5});assert.throws(()=>inspectOpus(opus(2)));
 const broken=opus();broken[30]^=1;assert.throws(()=>inspectOpus(broken));assert.throws(()=>inspectOpus(opus().subarray(0,50)));assert.throws(()=>inspectOpus(Buffer.from('not audio')));
});

test('audio: drugie uruchomienie nie uruchamia syntezy i nie dotyka manifestu ani klipów',async t=>{
 const output=await directory(t),plan=createPlan([material()],config()),r=renderer();await generateFiles(plan,output,r.ports);const manifest=join(output,'manifest.json'),clip=join(output,'clips',plan.clips[0].id+'.ogg');
 await utimes(manifest,1000,1000);await utimes(clip,1000,1000);const before=await readFile(manifest),result=await generateFiles(plan,output,r.ports);
 assert.equal(result.generated,0);assert.equal(result.reused,plan.clips.length);assert.equal(r.count.encoded,plan.clips.length);assert.equal((await stat(manifest)).mtimeMs,1000000);assert.equal((await stat(clip)).mtimeMs,1000000);assert.deepEqual(await readFile(manifest),before);
});

test('audio: aktualizacja jednego tekstu usuwa stary klip, a kontrola wykrywa nieaktualny zestaw',async t=>{
 const output=await directory(t),m=material(),c=config(),old=createPlan([m],c),r=renderer();await generateFiles(old,output,r.ports);m.words[0].back='pear';const plan=createPlan([m],c);await assert.rejects(checkGenerated(plan,output),/aktualnym/);
 const result=await generateFiles(plan,output,r.ports);assert.equal(result.generated,1);assert.equal(result.removed,1);assert.equal(result.reused,plan.clips.length-1);await checkGenerated(plan,output);assert.equal((await readdir(join(output,'clips'))).length,plan.clips.length);
});

test('audio: brakujące lub uszkodzone nagranie jest wykrywane i odtwarzane pojedynczo',async t=>{
 const output=await directory(t),plan=createPlan([material()],config()),r=renderer();await generateFiles(plan,output,r.ports);const clip=join(output,'clips',plan.clips[0].id+'.ogg');await writeFile(clip,'broken');await assert.rejects(checkGenerated(plan,output),/uszkodzone/);
 assert.equal((await generateFiles(plan,output,r.ports)).generated,1);await rm(clip);assert.equal((await generateFiles(plan,output,r.ports)).generated,1);await checkGenerated(plan,output);
});

test('audio: błąd syntezy i kompresji zachowuje poprzedni kompletny zestaw',async t=>{
 const output=await directory(t),m=material(),c=config(),plan=createPlan([m],c),r=renderer();await generateFiles(plan,output,r.ports);const before=await readFile(join(output,'manifest.json'));m.words[0].back='pear';const updated=createPlan([m],c);
 await assert.rejects(generateFiles(updated,output,{...r.ports,synthesize:async()=>{throw Error('engine failed');}}),/engine failed/);await checkGenerated(plan,output);assert.deepEqual(await readFile(join(output,'manifest.json')),before);
 await assert.rejects(generateFiles(updated,output,{...r.ports,encode:async()=>{throw Error('encoder failed');}}),/encoder failed/);await checkGenerated(plan,output);assert.deepEqual(await readFile(join(output,'manifest.json')),before);
});

test('audio: nieznane pliki i ścieżki spoza katalogu nie są automatycznie usuwane',async t=>{
 const output=await directory(t),plan=createPlan([material()],config()),r=renderer();await generateFiles(plan,output,r.ports);const extra=join(output,'notes.txt');await writeFile(extra,'keep me');await assert.rejects(generateFiles(plan,output,r.ports),/nieznany plik/);assert.equal(await readFile(extra,'utf8'),'keep me');await rm(extra);
 assert.throws(()=>inside(output,join(output,'..','outside')));const path=join(output,'manifest.json'),manifest=JSON.parse(await readFile(path,'utf8'));manifest.clips[plan.clips[0].id].file='../outside.ogg';await writeFile(path,JSON.stringify(manifest));await assert.rejects(checkGenerated(plan,output),/manifest/);
});

test('audio Food: wszystkie słowa i kwestie scen mają odwołania bez zmiany materiałów',()=>{
 const before=structuredClone(foodModules),plan=createPlan(foodModules,template),m=foodModules.find(v=>v.id==='unit-2-food')!,refs=plan.header.modules[0].references;
 assert.equal(refs.filter((r:any)=>r.kind==='word').length,m.words.length);assert.equal(refs.filter((r:any)=>r.kind==='scene-line').length,m.scenes!.reduce((n,s)=>n+s.lines.length,0));assert.ok(refs.every((r:any)=>r.text&&!r.text.includes('___')));assert.ok(refs.some((r:any)=>r.text==='an apple'));assert.deepEqual(foodModules,before);
});
