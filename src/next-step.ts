import { lessons,nextLesson,type Journey } from './adventure.ts';
import { keyFor,resolveItem,sessionCompatible,type Module,type Progress } from './core.ts';
import { labels } from './learning-labels.ts';
import { reviewState,stageForSession,stageKey } from './stage-review.ts';

interface StepBase {moduleId:string|null;catId:string}
export type NextStep = StepBase & (
  | {kind:'resume';title:string;question:number;total:number}
  | {kind:'lesson';lessonId:string;title:string;stageTitle:string;first:boolean;newModule:boolean}
  | {kind:'stage-review';stageId:string;title:string;pending:number}
  | {kind:'review';pending:number}
  | {kind:'practice'}
  | {kind:'unavailable'}
);

// Derive the destination from the existing account progress. No additional
// cursor is stored, so imports, offline saves and another device stay consistent.
export function getNextStep(modules:Module[],journeys:Journey[],p:Progress):NextStep {
  const ordered=journeys.filter(j=>modules.some(m=>m.id===j.moduleId)&&lessons(j).length)
    .sort((a,b)=>modules.find(m=>m.id===a.moduleId)!.order-modules.find(m=>m.id===b.moduleId)!.order);
  const active=p.active;
  if(active&&!active.completedAt){
    const catId=stageForSession(ordered,active)?.stage.cat??'albert';
    if(!sessionCompatible(modules,active))return {kind:'unavailable',moduleId:active.moduleId,catId};
    return {kind:'resume',moduleId:active.moduleId,catId,title:active.stageReview?.title??active.lesson?.title??labels[active.mode],question:Math.min(active.index+1,active.items.length),total:active.items.length};
  }

  const activity:{moduleId:string;at:number}[]=[];
  for(const s of p.sessions)if(modules.some(m=>m.id===s.moduleId))activity.push({moduleId:s.moduleId,at:Date.parse(s.completedAt??s.startedAt)});
  for(const j of ordered)for(const {key} of lessons(j)){
    const completion=p.adventure?.completed[key];if(completion)activity.push({moduleId:j.moduleId,at:Date.parse(completion.at)});
  }
  const recent=activity.filter(a=>Number.isFinite(a.at)).sort((a,b)=>b.at-a.at)[0]?.moduleId;
  const index=ordered.findIndex(j=>j.moduleId===recent);
  const candidates=index<0?ordered:[...ordered.slice(index),...ordered.slice(0,index)];
  // Unfinished reviews never block the next lesson or the next module.
  for(const j of candidates){
    const next=nextLesson(j,p);if(!next)continue;
    return {kind:'lesson',moduleId:j.moduleId,catId:next.stage.cat,lessonId:next.lesson.id,title:next.lesson.title,stageTitle:next.stage.title,first:next.key===lessons(j)[0].key,newModule:!!recent&&recent!==j.moduleId};
  }
  for(const j of candidates)for(const stage of j.stages){
    const pending=Object.values(reviewState(p,stageKey(j,stage))?.items??{}).filter(item=>item.correct<3);
    if(pending.length&&pending.every(entry=>resolveItem(modules,entry.item)))return {kind:'stage-review',moduleId:j.moduleId,catId:stage.cat,stageId:stage.id,title:stage.title,pending:pending.length};
  }
  const available=[...modules].sort((a,b)=>a.order-b.order);
  const preferred=[...available.filter(m=>m.id===recent),...available.filter(m=>m.id!==recent)];
  for(const m of preferred){
    const pending=m.words.filter(w=>p.words[keyFor(m,'word',w.id)]==='review'||p.difficult.includes(keyFor(m,'word',w.id))).length+
      m.exercises.filter(q=>q.requires.every(id=>id===m.id)&&p.difficult.includes(keyFor(m,'exercise',q.id))).length;
    if(pending)return {kind:'review',moduleId:m.id,catId:'albert',pending};
  }
  return {kind:'practice',moduleId:preferred[0]?.id??null,catId:'albert'};
}
