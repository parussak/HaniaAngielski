import { journeyKey,lessons,nextLesson,type Journey } from './adventure.ts';
import { sessionCompatible,type Module,type Progress } from './core.ts';
import { labels,lessonTitle } from './learning-labels.ts';
import { stageForSession } from './stage-review.ts';
import { compareModules, courseKey, sameCourse } from './learning/scope.ts';
import { coursePracticeLabels, type CoursePracticeMode } from './learning/course-practice.ts';

interface StepBase {moduleId:string|null;catId:string;journeyId?:string}
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
export function getNextStep(modules:Module[],journeys:Journey[],p:Progress,selectedCourseId?:string):NextStep {
  const ordered=journeys.filter(j=>modules.some(m=>m.id===j.moduleId)&&lessons(j).length)
    .sort((a,b)=>compareModules(modules.find(m=>m.id===a.moduleId)!,modules.find(m=>m.id===b.moduleId)!));
  const active=p.active;
  const activeModule=modules.find(m=>m.id===active?.moduleId);
  if(active&&!active.completedAt&&(!selectedCourseId||!activeModule||courseKey(activeModule)===selectedCourseId)){
    const catId=stageForSession(ordered,active)?.stage.cat??'albert';
    if(!sessionCompatible(modules,active))return {kind:'unavailable',moduleId:active.moduleId,catId};
    const context=stageForSession(ordered,active);
    return {kind:'resume',moduleId:active.moduleId,catId,...(context?.journey.id?{journeyId:journeyKey(context.journey)}:{}),title:active.scope?coursePracticeLabels[active.mode as CoursePracticeMode]:(active.training||active.stageReview||active.mode==='review'?labels.training:active.lesson?.title??labels[active.mode]),question:Math.min(active.index+1,active.items.length),total:active.items.length};
  }

  const activity:{moduleId:string;at:number}[]=[];
  for(const s of p.sessions)if(modules.some(m=>m.id===s.moduleId))activity.push({moduleId:s.moduleId,at:Date.parse(s.completedAt??s.startedAt)});
  for(const j of ordered)for(const {key} of lessons(j)){
    const completion=p.adventure?.completed[key];if(completion)activity.push({moduleId:j.moduleId,at:Date.parse(completion.at)});
  }
  const recent=activity.filter(a=>Number.isFinite(a.at)).sort((a,b)=>b.at-a.at)[0]?.moduleId;
  const anchor=selectedCourseId?modules.find(m=>courseKey(m)===selectedCourseId):modules.find(m=>m.id===recent)??modules[0];
  const available=anchor?modules.filter(m=>sameCourse(m,anchor)).sort(compareModules):[];
  const scoped=ordered.filter(j=>available.some(m=>m.id===j.moduleId));
  const index=scoped.findIndex(j=>j.moduleId===recent);
  const candidates=index<0?scoped:[...scoped.slice(index),...scoped.slice(0,index)];
  // Unfinished reviews never block the next lesson or the next module.
  for(const j of candidates){
    const next=nextLesson(j,p);if(!next)continue;
    return {kind:'lesson',moduleId:j.moduleId,catId:next.stage.cat,...(j.id?{journeyId:journeyKey(j)}:{}),lessonId:next.lesson.id,title:lessonTitle(next.lesson),stageTitle:next.stage.title,first:next.key===lessons(j)[0].key,newModule:!!recent&&recent!==j.moduleId};
  }
  const preferred=[...available.filter(m=>m.id===recent),...available.filter(m=>m.id!==recent)];
  return {kind:'practice',moduleId:preferred[0]?.id??null,catId:'albert'};
}
