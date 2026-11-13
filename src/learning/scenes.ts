import {next} from './session.ts';
import type {Exercise,Item,Module,Progress,Scene,Session} from './model.ts';

/**
 * D-53: a dialogue scene with several gaps. Content authors write the scene once;
 * here it becomes ordinary single-gap exercises, so grading, reviews and storage
 * stay shared with every other task. Nothing in this file knows a course or module.
 */
const fail=(message:string):never=>{throw new Error(`Błąd materiałów: ${message}`);};
const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const text=(v:unknown):v is string=>typeof v==='string'&&v.trim().length>0;
const id=(v:unknown):v is string=>typeof v==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
const gapsIn=(line:string)=>line.match(/___/g)?.length??0;
export const isSceneEntry=(entry:unknown)=>obj(entry)&&entry.gaps!==undefined;

/** Turns one authored scene into its script and one exercise per gap. */
export function compileScene(entry:unknown):{scene:Scene;exercises:Exercise[]}{
 if(!obj(entry)||!id(entry.id))return fail('scena wymaga identyfikatora z małych liter, cyfr i myślników.');
 const where=`scena ${entry.id}`;
 if(entry.kind!=='dialogue'||!text(entry.title)||entry.title.length>80||!text(entry.prompt))return fail(`${where}: wymagane kind "dialogue", tytuł do 80 znaków i polecenie.`);
 const lines=entry.dialogue,gaps=entry.gaps;
 if(!Array.isArray(lines)||lines.length<2||lines.length>8||!lines.every(line=>obj(line)&&text(line.speaker)&&text(line.text)&&line.speaker.length<=40&&line.text.length<=300))return fail(`${where}: rozmowa wymaga 2–8 kwestii z rozmówcą i tekstem.`);
 if(!Array.isArray(gaps)||gaps.length<2||gaps.length>6)return fail(`${where}: scena wymaga 2–6 luk.`);
 const script=lines as {speaker:string;text:string}[];
 if(script.reduce((n,line)=>n+gapsIn(line.text),0)!==gaps.length)return fail(`${where}: liczba luk ___ w kwestiach musi równać się liczbie wpisów w gaps.`);
 if(!gaps.every(gap=>obj(gap)&&id(gap.id)&&['bank','text'].includes(gap.input as string)&&Array.isArray(gap.answers)&&gap.answers.every(text)&&gap.answers.length>0))return fail(`${where}: każda luka wymaga id, input "bank" lub "text" i odpowiedzi.`);
 const list=gaps as {id:string;input:'bank'|'text';answers:string[];options?:unknown;explanation?:unknown;ruleId?:unknown;rev?:unknown}[];
 if(new Set(list.map(gap=>gap.id)).size!==list.length)return fail(`${where}: powtórzony identyfikator luki.`);
 if(!text(entry.source))return fail(`${where}: brak źródła (source).`);
 // Position of every gap in the script, in reading order.
 const places=script.flatMap((line,index)=>Array.from({length:gapsIn(line.text)},()=>index));
 const filled=(lineIndex:number,keep?:number)=>{
  let gap=places.indexOf(lineIndex);
  return {speaker:script[lineIndex].speaker,text:script[lineIndex].text.replace(/___/g,()=>{const current=gap++;return current===keep?'___':list[current].answers[0];})};
 };
 const exercises=list.map((gap,index):Exercise=>{
  const line=places[index];
  // Outside the scene the gap is a short dialogue: its own line and a neighbour.
  const dialogue=line>0?[filled(line-1),filled(line,index)]:[filled(line,index),filled(1)];
  return {id:`${entry.id}--${gap.id}`,kind:'dialogue',prompt:entry.prompt as string,dialogue,answers:gap.answers,options:gap.options as string[],explanation:gap.explanation as string,requires:entry.requires as string[],caseSensitive:entry.caseSensitive as boolean,source:entry.source as string,
   ...(gap.ruleId!==undefined?{ruleId:gap.ruleId as string}:{}),...(gap.rev!==undefined?{rev:gap.rev as number}:{}),...(entry.illustration!==undefined?{illustration:entry.illustration as Exercise['illustration']}:{}),
   scene:{id:entry.id as string,gap:index,input:gap.input}};
 });
 return {scene:{id:entry.id,title:entry.title,prompt:entry.prompt,lines:script.map(line=>({speaker:line.speaker,text:line.text})),gapIds:exercises.map(q=>q.id)},exercises};
}

/** Structural check of compiled scenes; the gap exercises are checked like any exercise. */
export function validateScenes(m:{id:unknown;scenes?:unknown;exercises:unknown[]}){
 const exercises=m.exercises as Exercise[];
 if(m.scenes!==undefined&&!Array.isArray(m.scenes))return fail(`niepoprawna lista scen (${m.id}).`);
 const scenes=(m.scenes??[]) as Scene[];
 if(new Set(scenes.map(s=>s?.id)).size!==scenes.length)return fail(`powtórzony identyfikator sceny (${m.id}).`);
 for(const scene of scenes){
  if(!obj(scene)||!id(scene.id)||!text(scene.title)||!text(scene.prompt)||!Array.isArray(scene.lines)||scene.lines.length<2||scene.lines.length>8||!scene.lines.every(line=>obj(line)&&text(line.speaker)&&text(line.text))||!Array.isArray(scene.gapIds)||scene.gapIds.length<2||scene.gapIds.length>6)return fail(`niepoprawna scena (${m.id}/${(scene as Scene)?.id??'?'}).`);
  if(scene.lines.reduce((n,line)=>n+gapsIn(line.text),0)!==scene.gapIds.length)return fail(`scena ${scene.id}: liczba luk nie zgadza się z rozmową.`);
  scene.gapIds.forEach((gapId,index)=>{const q=exercises.find(q=>q.id===gapId);if(!q||q.kind!=='dialogue'||q.scene?.id!==scene.id||q.scene.gap!==index)fail(`scena ${scene.id}: brak zadania dla luki ${gapId}.`);});
 }
 for(const q of exercises)if(q.scene!==undefined){
  if(!obj(q.scene)||!['bank','text'].includes(q.scene.input)||scenes.find(s=>s.id===q.scene!.id)?.gapIds[q.scene.gap]!==q.id)return fail(`zadanie ${q.id} wskazuje nieistniejącą scenę.`);
 }
}

/** Exercise ids of the listed scenes, in script order — what a lesson puts into exerciseIds. */
export function sceneGapIds(m:Pick<Module,'scenes'>,sceneIds:string[]){return sceneIds.flatMap(sceneId=>m.scenes?.find(s=>s.id===sceneId)?.gapIds??[]);}

function gapOf(modules:Module[],item:Item){
 if(item.type!=='exercise')return;
 const m=modules.find(m=>m.id===item.moduleId),q=m?.exercises.find(q=>q.id===item.id&&(q.rev??1)===item.version);
 const scene=q?.scene&&m!.scenes?.find(s=>s.id===q.scene!.id);
 return scene?{scene,gap:q!.scene!}:undefined;
}
/**
 * Marks every scene whose gaps are all in the session as one group: together, in
 * script order, each gap with its authored way of answering. A lone gap stays an
 * ordinary single-gap dialogue.
 */
export function groupScenes(modules:Module[],s:Pick<Session,'items'>,place:'keep'|'end'='keep'){
 for(const item of s.items)delete item.sceneGroup;
 const found=new Map<Scene,Item[]>();
 for(const item of s.items){const entry=gapOf(modules,item);if(entry)found.set(entry.scene,[...(found.get(entry.scene)??[]),item]);}
 for(const [scene,items] of found){
  const ordered=scene.gapIds.map(gapId=>items.find(i=>i.id===gapId));
  if(items.length!==scene.gapIds.length||ordered.some(i=>!i))continue;
  const group=ordered as Item[],start=Math.min(...group.map(i=>s.items.indexOf(i)));
  for(const item of group){delete item.pairGroup;delete item.gapGroup;delete item.presentation;delete item.options;item.sceneGroup=group[0].key;item.input=gapOf(modules,item)!.gap.input==='bank'?'choice':'text';}
  const before=s.items.slice(0,start).filter(i=>!group.includes(i)),after=s.items.slice(start).filter(i=>!group.includes(i));
  s.items=place==='end'?[...before,...after,...group]:[...before,...group,...after];
 }
 return s;
}

/** The scene on screen: its script, its items in order and the current position. */
export function sceneView(modules:Module[],s:Session){
 const current=s.items[s.index];if(!current?.sceneGroup)return;
 const entry=gapOf(modules,current);if(!entry)return;
 const items=s.items.filter(i=>i.sceneGroup===current.sceneGroup);
 if(items.length!==entry.scene.gapIds.length||items.some((item,index)=>item.id!==entry.scene.gapIds[index]))return;
 return {scene:entry.scene,items,position:items.indexOf(current)};
}

/** After a correct gap the conversation continues; the last gap closes it with one summary. */
export function continueScene(p:Progress){
 const s=p.active;if(!s||s.phase!=='feedback'||s.lastCorrect!==true)return;
 const item=s.items[s.index];if(!item.sceneGroup)return;
 if(s.items[s.index+1]?.sceneGroup===item.sceneGroup)next(p);else s.boardSummary=true;
}
