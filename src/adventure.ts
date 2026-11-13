import {creditStars} from './house/progress.ts';
import {courseForModule} from './learning/scope.ts';
import {rewardStars} from './learning/rewards.ts';
import {journeyKey,lessonKey,lessons,type Journey,type Lesson,type Stage,type JourneyIssue} from './learning/journey.ts';
export {journeyKey,lessonKey,lessons} from './learning/journey.ts';
export type {Journey,Lesson,Stage,JourneyIssue} from './learning/journey.ts';
import type {Home} from './house/progress.ts';
export {decorations,slots} from './house/catalog.ts';
export {stars,purchase,place} from './house/progress.ts';
import { inputFor,keyFor,questionFor,type AnswerMode,type Item,type Module,type Progress,type Session } from './core.ts';
import type { StageReview } from './stage-review.ts';
import { compareModules } from './learning/scope.ts';
import {plannedStage,type SectionPlan} from './learning/section-plan.ts';
import {groupScenes} from './learning/scenes.ts';
export interface Adventure extends Home {
  courseHomes?:Record<string,Home>;
  version:1;completed:Record<string,{at:string;edition?:2}>;
  reviewDay?:string;
  reviewSchema?:1;reviewArchiveHead?:string|null;stageReviews?:Record<string,StageReview>;
  sectionPlans?:Record<string,SectionPlan>;
  memory?:Record<string,{item:Item;correct:number}>;
}
export const freshAdventure=():Adventure=>({version:1,earned:0,completed:{},purchases:{}});
export function orderedJourneys(modules:Module[],journeys:Journey[]){return journeys.filter(j=>modules.some(m=>m.id===j.moduleId)).slice().sort((a,b)=>compareModules(modules.find(m=>m.id===a.moduleId)!,modules.find(m=>m.id===b.moduleId)!));}
// D-52: every account sees the current lesson content. Completion depends only on
// the lesson key, and a started session resumes from its own saved item list, so
// neither needs the superseded definition. The saved edition is a historical marker.
export function lessonForProgress(_j:Journey,l:Lesson,_p:Progress):Lesson {
  return l.update?{...l,...l.update}:l;
}
export function journeyForProgress(j:Journey,p:Progress):Journey{return {...j,stages:j.stages.map(s=>{const planned=plannedStage(j,s,p);return {...planned,lessons:planned.lessons.map(l=>lessonForProgress(j,l,p))};})};}
export function nextLesson(journey:Journey,p:Progress){return lessons(journeyForProgress(journey,p)).find(({key})=>!p.adventure?.completed[key]);}
export function unlocked(journey:Journey,lesson:Lesson,_p:Progress){return lessons(journey).some(l=>l.lesson.id===lesson.id);}
export function validateJourney(value:unknown,m:Module):Journey {
  const j=value as Journey,fail=():never=>{throw new Error('Niepoprawna mapa modułu.');};
  if(!j || j.version!==1 || j.moduleId!==m.id || !/^[a-z0-9-]+$/.test(j.moduleId) || typeof j.title!=='string' || !Array.isArray(j.stages)||!j.stages.length)return fail();
  if(j.id!==undefined&&!/^[a-z0-9-]+$/.test(j.id))return fail();
  const ids=new Set<string>(),stageIds=new Set<string>();
  for(const stage of j.stages){
    if(!stage || !/^[a-z0-9-]+$/.test(stage.id) || stageIds.has(stage.id) || typeof stage.title!=='string'||!['albert','olus','felix','maja','krzywolap'].includes(stage.cat)||!/^illustrations\/[a-z0-9-]+\.svg$/.test(stage.illustration)||!Array.isArray(stage.lessons)||!stage.lessons.length)return fail();
    stageIds.add(stage.id);
    if(stage.adaptiveReviews!==undefined&&(stage.adaptiveReviews!==true||stage.lessons.length!==7||stage.lessons.some(l=>l.id.startsWith(`${stage.id}-recall-`))))return fail();
    for(const l of stage.lessons){
      if(!l || !/^[a-z0-9-]+$/.test(l.id)||ids.has(l.id)||typeof l.title!=='string'||typeof l.intro!=='string'||![l.wordIds,l.exerciseIds,l.ruleIds].every(Array.isArray)||l.wordIds.length+l.exerciseIds.length<(l.role==='training'?0:1)||l.wordIds.length+l.exerciseIds.length>10)return fail();
      // D-53: a lesson takes a dialogue scene whole — all of its gaps or none.
      for(const scene of m.scenes??[]){const listed=scene.gapIds.filter(id=>l.exerciseIds.includes(id)).length;if(listed&&listed!==scene.gapIds.length)return fail();}
      if(l.role!==undefined&&l.role!=='training'||l.targetCount!==undefined&&(!Number.isInteger(l.targetCount)||l.targetCount<6||l.targetCount>10)||l.role==='training'&&(l.wordIds.length+l.exerciseIds.length+l.ruleIds.length>0))return fail();
      if(j.id&&l.role!=='training'&&l.wordIds.length+l.exerciseIds.length<6)return fail();
      ids.add(l.id);
      if(new Set([...l.wordIds,...l.exerciseIds]).size!==l.wordIds.length+l.exerciseIds.length || !l.wordIds.every(id=>m.words.some(w=>w.id===id))||!l.exerciseIds.every(id=>m.exercises.some(q=>q.id===id&&q.requires.every(id=>id===m.id)))||!l.ruleIds.every(id=>m.grammar.some(r=>r.id===id)))return fail();
      if(l.edition!==undefined&&l.edition!==2)return fail();
      if(l.update!==undefined){
        if(!l.update||l.update.edition!==2||l.role||'update' in l.update||'id' in l.update||'role' in l.update)return fail();
        validateJourney({...j,id:j.id??'updated',stages:[{...stage,adaptiveReviews:undefined,lessons:[{...l.update,id:l.id}]}]},m);
      }
    }
  }
  return structuredClone(j);
}
export async function readJourneys(modules:Module[],read:(path:string)=>Promise<unknown>):Promise<{journeys:Journey[];issues:JourneyIssue[]}>{
  const requests=modules.flatMap(m=>(m.journeyPaths??(m.journeyPath?[m.journeyPath]:m.id==='unit-2-food'?['02-food/sciezka.json']:[])).map(path=>({m,path})));
  const results=await Promise.allSettled(requests.map(async({m,path})=>validateJourney(await read(path),m)));
  const counts=new Map<string,number>();
  for(const result of results)if(result.status==='fulfilled'){const key=journeyKey(result.value);counts.set(key,(counts.get(key)??0)+1);}
  const journeys:Journey[]=[],issues:JourneyIssue[]=[];
  results.forEach((result,index)=>{
    if(result.status==='fulfilled'&&counts.get(journeyKey(result.value))===1)journeys.push(result.value);
    else issues.push({moduleId:requests[index].m.id,path:requests[index].path});
  });
  return {journeys,issues};
}
export async function loadJourneys(modules:Module[]){
  return readJourneys(modules,async path=>{
    const r=await fetch(new URL(`content/${path}`,document.baseURI),{cache:'no-cache'});
    if(!r.ok)throw new Error('Nie można pobrać kociej mapy.');return r.json();
  });
}
export function makeLessonSession(modules:Module[],journey:Journey,lesson:Lesson,answerMode:AnswerMode,p:Progress):Session {
  lesson=lessonForProgress(journey,lesson,p);
  if(lesson.role)throw new Error('Trening i powtórka wymagają doboru wcześniej poznanego materiału.');
  if(!unlocked(journey,lesson,p))throw new Error('Najpierw ukończ wcześniejszą lekcję.');
  const m=modules.find(m=>m.id===journey.moduleId)!;
  const items:Item[]=[...lesson.wordIds.map(id=>({key:keyFor(m,'word',id),moduleId:m.id,version:m.words.find(w=>w.id===id)?.rev??1,type:'word' as const,id,input:'text' as const})),...lesson.exerciseIds.map(id=>({key:keyFor(m,'exercise',id),moduleId:m.id,version:m.exercises.find(q=>q.id===id)?.rev??1,type:'exercise' as const,id,input:'text' as const}))];
  items.forEach((item,i)=>item.input=inputFor(questionFor(modules,item),answerMode==='mixed'?(i%2?'text':'choice'):answerMode));
  return groupScenes(modules,{fixedLength:true,id:crypto.randomUUID(),moduleId:m.id,mode:'lesson',lesson:{id:lessonKey(journey,lesson),title:lesson.title,...(lesson.edition?{edition:lesson.edition}:{})},answerMode,previous:false,startedAt:new Date().toISOString(),completedAt:null,items,index:0,phase:'question',lastCorrect:null,attempts:[],repeatKeys:[]} as Session,'end') as Session;
}
export function rewardCompletion(p:Progress,s:Session,modules:Module[]=[]){
  if(!s.completedAt || !s.items.every(i=>s.attempts.some(a=>a.key===i.key)))return 0;
  const a=p.adventure??freshAdventure();
  let reward=0;
  const saved=p.sessions.find(session=>session.id===s.id);
  if(s.lesson && !Object.hasOwn(a.completed,s.lesson.id)){a.completed[s.lesson.id]={at:s.completedAt,...(s.lesson.edition?{edition:s.lesson.edition}:{})};reward=rewardStars.firstLesson;}
  else if(s.lesson&&s.fixedLength&&saved&&!saved.lessonRewarded)reward=rewardStars.lessonReplay;
  if(s.lesson&&reward){s.lessonRewarded=true;if(saved)saved.lessonRewarded=true;}
  if(s.training?.kind==='extra'){
    const saved=p.sessions.find(session=>session.id===s.id);
    if(saved?.training?.kind==='extra'&&!saved.training.rewarded){saved.training.rewarded=true;s.training.rewarded=true;reward=rewardStars.extraTraining;}
  }
  if(reward){p.adventure=a;creditStars(p,reward,courseForModule(modules,s.moduleId));}
  return reward;
}
