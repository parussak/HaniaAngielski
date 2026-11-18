import {createHash} from 'node:crypto';
import {keyFor} from '../../src/learning/model.ts';
import {questionFor} from '../../src/learning/questions.ts';
import {vocabularyFullAnswer} from '../../src/learning/vocabulary-answer.ts';
import {normalizeSpeechText} from '../../src/speech/text.ts';

export const generatorVersion=1;
export const hash=value=>createHash('sha256').update(value).digest('hex');
export function canonical(value){
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
 return JSON.stringify(value);
}
export const normalizeText=normalizeSpeechText;
const id=value=>typeof value==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const primary=lang=>lang.toLowerCase().split(/[-_]/)[0];
const fail=message=>{throw Error(`Audio: ${message}`);};
const file=value=>value&&typeof value.file==='string'&&/^[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)*$/.test(value.file)&&!value.file.split('/').some(v=>v==='.'||v==='..')&&/^[a-f0-9]{64}$/.test(value.sha256);
export function validateConfig(config){
 if(config?.version!==1||typeof config.defaultToolsDirectory!=='string'||!file(config.tools?.piper)||!file(config.tools?.ffmpeg)||!config.profiles||!Array.isArray(config.modules)||!config.modules.length)fail('niepoprawna konfiguracja generatora.');
 const seen=new Set();
 for(const target of config.modules){if(!id(target.id)||seen.has(target.id)||!id(target.profile)||!Object.hasOwn(config.profiles,target.profile))fail('niepoprawny lub powtórzony moduł/profil.');seen.add(target.id);}
 for(const [key,p] of Object.entries(config.profiles)){
  if(!id(key)||!p||typeof p.voice!=='string'||!p.voice.trim()||typeof p.language!=='string'||!/^\w+(?:[-_]\w+)*$/.test(p.language)||!file(p.model)||!file(p.modelConfig)||typeof p.source!=='string')fail('niepoprawny głos.');
  const i=p.inference,e=p.encoding,f=p.processing;
  if(!i||!Number.isFinite(i.lengthScale)||i.lengthScale<=0||i.lengthScale>3||!Number.isFinite(i.sentenceSilence)||i.sentenceSilence<0||i.sentenceSilence>2)fail('niepoprawne tempo.');
  if(!e||e.codec!=='libopus'||e.channels!==1||!Number.isInteger(e.bitrate)||e.bitrate<8000||e.bitrate>128000||e.sampleRate!==24000||e.application!=='voip')fail('niepoprawny format Opus mono.');
  if(!f||!['silenceThresholdDb','startSilence','endSilence','loudness','truePeak','loudnessRange'].every(k=>Number.isFinite(f[k]))||f.silenceThresholdDb>=0||f.silenceThresholdDb< -90||f.startSilence<0||f.endSilence<0||f.startSilence>1||f.endSilence>1||f.loudness< -50||f.loudness> -5||f.truePeak>0||f.truePeak< -10||f.loudnessRange<1||f.loudnessRange>50)fail('niepoprawna obróbka głośności lub ciszy.');
  const s=p.synthesis;
  if(s!==undefined&&(!s||typeof s!=='object'||!/^[,;]$/.test(s.singleWordSuffix)||!Array.isArray(s.articles)||!s.articles.every(a=>typeof a==='string'&&/^[\p{Ll}']+$/u.test(a))))fail('niepoprawne ustawienia syntezy pojedynczych słów.');
 }
 return structuredClone(config);
}
/**
 * Tekst podawany Piperowi. Hasło z jednego słowa (także z rodzajnikiem z listy profilu) dostaje
 * na końcu przecinek zamiast kropki/wykrzyknika: w próbie odsłuchu (D-66) brzmiało pewniej
 * i bez przeciągania. Wyświetlany tekst i klucz odtwarzacza pozostają bez zmian.
 */
export function synthesisText(text,synthesis){
 if(!synthesis)return text;
 const base=text.replace(/[.!?,;:…]+$/u,'').trim(),words=base.split(/\s+/);
 const rest=words.length>1&&synthesis.articles.includes(words[0].toLowerCase())?words.slice(1):words;
 return rest.length===1&&base?base+synthesis.singleWordSuffix:text;
}
export function createPlan(modules,input){
 const config=validateConfig(input),clips=new Map(),profiles={},plannedModules=[];
 for(const target of [...config.modules].sort((a,b)=>a.id.localeCompare(b.id))){
  const m=modules.find(m=>m.id===target.id),p=config.profiles[target.profile];
  if(!m?.languageCode||primary(m.languageCode)!==primary(p.language))fail(`brak modułu lub głos nie pasuje do języka: ${target.id}.`);
  profiles[target.profile]=p;
  const references=[];
  const add=(key,kind,text,extra={})=>{
   text=normalizeText(text);if(!text||text.length>1000||text.includes('___'))fail(`niepełny tekst: ${key}.`);
   const fingerprint={generatorVersion,language:m.languageCode,voice:p.voice,voiceLanguage:p.language,model:p.model.sha256,modelConfig:p.modelConfig.sha256,tools:{piper:config.tools.piper.sha256,ffmpeg:config.tools.ffmpeg.sha256},inference:p.inference,encoding:p.encoding,processing:p.processing};
   const spoken=kind==='word'?synthesisText(text,p.synthesis):text,said=spoken!==text?{spoken}:{};
   const clip=hash(canonical({text,...said,...fingerprint}));
   clips.set(clip,{id:clip,text,language:m.languageCode,profile:target.profile,...said});references.push({key,kind,text,...said,clip,...extra});
  };
  for(const w of m.words){const key=keyFor(m,'word',w.id);add(key,'word',vocabularyFullAnswer(questionFor(modules,{key,moduleId:m.id,id:w.id,version:w.rev??1,type:'word',input:'text'})));}
  for(const scene of m.scenes??[]){
   let gap=0;
   scene.lines.forEach((line,index)=>{
    const text=line.text.replace(/___/g,()=>{const gapId=scene.gapIds[gap++],q=m.exercises.find(q=>q.id===gapId);if(!q?.answers?.[0])fail(`brak odpowiedzi sceny ${scene.id}.`);return q.answers[0];});
    add(`${m.id}:scene:${scene.id}:line:${index}`,'scene-line',text,{sceneId:scene.id,line:index,speaker:line.speaker});
   });
   if(gap!==scene.gapIds.length)fail(`niezgodne luki sceny ${scene.id}.`);
  }
  references.sort((a,b)=>a.key.localeCompare(b.key));
  plannedModules.push({moduleId:m.id,courseId:m.courseId,language:m.languageCode,profile:target.profile,references});
 }
 return {header:{version:1,generatorVersion,tools:config.tools,profiles,modules:plannedModules},clips:[...clips.values()].sort((a,b)=>a.id.localeCompare(b.id))};
}
