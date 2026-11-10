import { inputFor,keyFor,questionFor,type AnswerMode,type Item,type Module,type Progress,type Session } from './core.ts';
import type { StageReview } from './stage-review.ts';
import { compareModules } from './learning/scope.ts';
export interface Lesson {id:string;title:string;intro:string;wordIds:string[];exerciseIds:string[];ruleIds:string[];role?:'training';targetCount?:number}
export interface Stage {id:string;title:string;cat:string;illustration:string;lessons:Lesson[]}
export interface Journey {version:1;moduleId:string;id?:string;title:string;stages:Stage[]}
export interface Adventure {
  version:1;earned:number;completed:Record<string,{at:string}>;
  purchases:Record<string,{cost:number;slot:string|null}>;reviewDay?:string;
  reviewSchema?:1;reviewArchiveHead?:string|null;stageReviews?:Record<string,StageReview>;
}
export const freshAdventure=():Adventure=>({version:1,earned:0,completed:{},purchases:{}});
export const slots=[{id:'left',name:'Lewy kącik'},{id:'window',name:'Pod oknem'},{id:'right',name:'Prawy kącik'},{id:'rug',name:'Na dywanie'},{id:'shelf',name:'Na półce'},{id:'front',name:'Z przodu'}];
export const decorations=[
 {id:'pillow',name:'Poduszka',price:6,slot:'rug'},
 {id:'yarn',name:'Kłębek',price:4,slot:'front'},
 {id:'scratcher',name:'Drapak',price:12,slot:'left'},
 {id:'plant',name:'Roślinka',price:8,slot:'window'},
 {id:'books',name:'Książeczki',price:10,slot:'shelf'},
 {id:'basket',name:'Koszyk',price:8,slot:'right'},
] as const;
export const stars=(p:Progress)=>{const a=p.adventure;return a?a.earned-Object.values(a.purchases).reduce((n,item)=>n+item.cost,0):0;};
export const journeyKey=(journey:Journey)=>journey.id?`${journey.moduleId}/${journey.id}`:journey.moduleId;
export const lessonKey=(journey:Journey,lesson:Lesson)=>`${journeyKey(journey)}/${lesson.id}`;
export function orderedJourneys(modules:Module[],journeys:Journey[]){return journeys.filter(j=>modules.some(m=>m.id===j.moduleId)).slice().sort((a,b)=>compareModules(modules.find(m=>m.id===a.moduleId)!,modules.find(m=>m.id===b.moduleId)!));}
export function lessons(journey:Journey){return journey.stages.flatMap(stage=>stage.lessons.map(lesson=>({stage,lesson,key:lessonKey(journey,lesson)})));}
export function nextLesson(journey:Journey,p:Progress){return lessons(journey).find(({key})=>!p.adventure?.completed[key]);}
export function unlocked(journey:Journey,lesson:Lesson,p:Progress){const all=lessons(journey),index=all.findIndex(l=>l.lesson.id===lesson.id);return index>=0&&all.slice(0,index).every(l=>p.adventure?.completed[l.key]);}
export function validateJourney(value:unknown,m:Module):Journey {
  const j=value as Journey,fail=():never=>{throw new Error('Niepoprawna mapa modułu.');};
  if(!j || j.version!==1 || j.moduleId!==m.id || !/^[a-z0-9-]+$/.test(j.moduleId) || typeof j.title!=='string' || !Array.isArray(j.stages)||!j.stages.length)return fail();
  if(j.id!==undefined&&!/^[a-z0-9-]+$/.test(j.id))return fail();
  const ids=new Set<string>(),stageIds=new Set<string>();
  for(const stage of j.stages){
    if(!stage || !/^[a-z0-9-]+$/.test(stage.id) || stageIds.has(stage.id) || typeof stage.title!=='string'||!['albert','olus','felix','maja','krzywolap'].includes(stage.cat)||!/^illustrations\/[a-z0-9-]+\.svg$/.test(stage.illustration)||!Array.isArray(stage.lessons)||!stage.lessons.length)return fail();
    stageIds.add(stage.id);
    for(const l of stage.lessons){
      if(!l || !/^[a-z0-9-]+$/.test(l.id)||ids.has(l.id)||typeof l.title!=='string'||typeof l.intro!=='string'||![l.wordIds,l.exerciseIds,l.ruleIds].every(Array.isArray)||l.wordIds.length+l.exerciseIds.length<(l.role==='training'?0:1)||l.wordIds.length+l.exerciseIds.length>10)return fail();
      if(l.role!==undefined&&l.role!=='training'||l.targetCount!==undefined&&(!Number.isInteger(l.targetCount)||l.targetCount<6||l.targetCount>10)||l.role==='training'&&(l.wordIds.length+l.exerciseIds.length+l.ruleIds.length>0))return fail();
      if(j.id&&l.role!=='training'&&l.wordIds.length+l.exerciseIds.length<6)return fail();
      ids.add(l.id);
      if(new Set([...l.wordIds,...l.exerciseIds]).size!==l.wordIds.length+l.exerciseIds.length || !l.wordIds.every(id=>m.words.some(w=>w.id===id))||!l.exerciseIds.every(id=>m.exercises.some(q=>q.id===id&&q.requires.every(id=>id===m.id)))||!l.ruleIds.every(id=>m.grammar.some(r=>r.id===id)))return fail();
    }
  }
  return structuredClone(j);
}
export async function loadJourneys(modules:Module[]):Promise<Journey[]>{
  const requests=modules.flatMap(m=>(m.journeyPaths??(m.journeyPath?[m.journeyPath]:m.id==='unit-2-food'?['02-food/sciezka.json']:[])).map(path=>({m,path})));
  const journeys=await Promise.all(requests.map(async({m,path})=>{
    const r=await fetch(new URL(`content/${path}`,document.baseURI),{cache:'no-cache'});
    if(!r.ok)throw new Error('Nie można pobrać kociej mapy.');return validateJourney(await r.json(),m);
  }));
  if(new Set(journeys.map(journeyKey)).size!==journeys.length)throw new Error('Powtórzony identyfikator mapy.');
  return journeys;
}
export function makeLessonSession(modules:Module[],journey:Journey,lesson:Lesson,answerMode:AnswerMode,p:Progress):Session {
  if(lesson.role==='training')throw new Error('Trening wymaga doboru wcześniej poznanego materiału.');
  if(!unlocked(journey,lesson,p))throw new Error('Najpierw ukończ wcześniejszą lekcję.');
  const m=modules.find(m=>m.id===journey.moduleId)!;
  const items:Item[]=[...lesson.wordIds.map(id=>({key:keyFor(m,'word',id),moduleId:m.id,version:m.words.find(w=>w.id===id)?.rev??1,type:'word' as const,id,input:'text' as const})),...lesson.exerciseIds.map(id=>({key:keyFor(m,'exercise',id),moduleId:m.id,version:m.exercises.find(q=>q.id===id)?.rev??1,type:'exercise' as const,id,input:'text' as const}))];
  items.forEach((item,i)=>item.input=inputFor(questionFor(modules,item),answerMode==='mixed'?(i%2?'text':'choice'):answerMode));
  return {id:crypto.randomUUID(),moduleId:m.id,mode:'lesson',lesson:{id:lessonKey(journey,lesson),title:lesson.title},answerMode,previous:false,startedAt:new Date().toISOString(),completedAt:null,items,index:0,phase:'question',lastCorrect:null,attempts:[],repeatKeys:[]};
}
export function rewardCompletion(p:Progress,s:Session){
  if(!s.completedAt || !s.items.every(i=>s.attempts.some(a=>a.key===i.key)))return 0;
  const a=p.adventure??freshAdventure();
  let reward=0;
  if(s.lesson && !Object.hasOwn(a.completed,s.lesson.id)){a.completed[s.lesson.id]={at:s.completedAt};reward=3;}
  if(s.training?.kind==='extra'){
    const saved=p.sessions.find(session=>session.id===s.id);
    if(saved?.training?.kind==='extra'&&!saved.training.rewarded){saved.training.rewarded=true;s.training.rewarded=true;reward=1;}
  }
  if(reward){a.earned+=reward;p.adventure=a;}
  return reward;
}
export function purchase(p:Progress,id:string){
  const item=decorations.find(d=>d.id===id);if(!item)throw new Error('Nieznana dekoracja.');
  const a=p.adventure??freshAdventure();if(Object.hasOwn(a.purchases,id))return false;
  if(stars(p)<item.price)return false;
  const occupied=new Set(Object.values(a.purchases).map(v=>v.slot));
  a.purchases[id]={cost:item.price,slot:occupied.has(item.slot)?null:item.slot};p.adventure=a;return true;
}
export function place(p:Progress,id:string,slot:string|null){
  const a=p.adventure,item=a?.purchases[id];if(!item || (slot!==null&&!slots.some(s=>s.id===slot)))return false;
  const other=Object.entries(a!.purchases).find(([key,v])=>key!==id&&slot!==null&&v.slot===slot);
  if(other)other[1].slot=item.slot;item.slot=slot;return true;
}
