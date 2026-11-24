/** Mapa widziana przez postęp konta: kolejność map, bieżąca treść lekcji, następna lekcja. */
import {lessons,type Journey,type Lesson} from './journey.ts';
import {compareModules} from './scope.ts';
import {plannedStage} from './section-plan.ts';
import type {Module,Progress} from './model.ts';
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
