import {journeyForProgress,journeyKey,lessons,makeLessonSession,orderedJourneys,type Journey,type Lesson} from '../adventure.ts';
import {sameCourse} from './scope.ts';
import {type Module,type Progress,type Session} from './model.ts';
import {sessionCompatible} from './questions.ts';

/** A regular lesson replays its current content (D-52); dynamic sets are copied. */
export function legendarySession(modules:Module[],finished:Session,current?:{journey:Journey;lesson:Lesson;progress:Progress}):Session|null{
 if(!finished.lesson||!finished.completedAt||!finished.items.every(i=>finished.attempts.some(a=>a.key===i.key)))return null;
 if(current&&!current.lesson.role&&!finished.recall&&!finished.training&&modules.some(m=>m.id===current.journey.moduleId))
  return {...makeLessonSession(modules,current.journey,current.lesson,'mixed',current.progress),legendary:true};
 if(!sessionCompatible(modules,finished))return null;
 const copy=structuredClone(finished);delete copy.retentionCounted;delete copy.lessonRewarded;delete copy.pairSelection;delete copy.draftAnswer;
 // Older sessions could append the same task after a mistake. A new full replay
 // includes each source task once, without restoring that old endless-loop policy.
 copy.items=[...new Map(copy.items.map(i=>[i.key,i])).values()];
 return {...copy,id:crypto.randomUUID(),legendary:true,fixedLength:true,startedAt:new Date().toISOString(),completedAt:null,index:0,phase:'question',lastCorrect:null,attempts:[],repeatKeys:[]};
}

export function lessonContext(journeys:Journey[],p:Progress,s:Session){
 for(const raw of journeys){const journey=journeyForProgress(raw,p),entry=lessons(journey).find(e=>e.key===s.lesson?.id);if(entry)return {journey,lesson:entry.lesson};}
}
export function followingLesson(modules:Module[],journeys:Journey[],p:Progress,s:Session):{journey:Journey;lesson:Lesson}|undefined{
 const m=modules.find(m=>m.id===s.moduleId);if(!m||!s.lesson)return;
 const all=orderedJourneys(modules.filter(v=>sameCourse(v,m)),journeys).flatMap(raw=>{const journey=journeyForProgress(raw,p);return lessons(journey).map(e=>({...e,journey}));});
 const index=all.findIndex(e=>e.key===s.lesson!.id);if(index<0)return;
 const next=[...all.slice(index+1),...all.slice(0,index)].find(e=>!p.adventure?.completed[e.key]);
 return next?{journey:next.journey,lesson:next.lesson}:undefined;
}
