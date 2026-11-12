import {journeyKey,lessonKey,type Journey,type Stage} from './journey.ts';
import type {Progress} from './model.ts';
export interface SectionPlan {baseIds:string[];after:[number,number]}
export const sectionKey=(j:Journey,s:Stage)=>`${journeyKey(j)}/${s.id}`;
function eligible(j:Journey,s:Stage,p:Progress){
 const keys=new Set(s.lessons.map(l=>lessonKey(j,l)));
 return s.adaptiveReviews&&s.lessons.length===7&&!s.lessons.some(l=>l.role==='recall')&&
  !Object.keys(p.adventure?.completed??{}).some(k=>keys.has(k))&&!keys.has(p.active?.lesson?.id??'')&&
  !p.sessions.some(session=>keys.has(session.lesson?.id??''));
}
export function needsSectionPlans(journeys:Journey[],p:Progress){return journeys.some(j=>j.stages.some(s=>!p.adventure?.sectionPlans?.[sectionKey(j,s)]&&eligible(j,s,p)));}
export function prepareSectionPlans(journeys:Journey[],p:Progress,random=Math.random){
 for(const j of journeys)for(const s of j.stages){
  if(p.adventure?.sectionPlans?.[sectionKey(j,s)]||!eligible(j,s,p))continue;
  p.adventure??={version:1,earned:0,purchases:{},completed:{}};
  const pairs:[number,number][]=[];for(let a=2;a<=4;a++)for(let b=a+2;b<=6;b++)pairs.push([a,b]);
  const after=pairs[Math.min(pairs.length-1,Math.max(0,Math.floor(random()*pairs.length)))];
  (p.adventure.sectionPlans??={})[sectionKey(j,s)]={baseIds:s.lessons.map(l=>l.id),after:[...after]};
 }
}
export function plannedStage(j:Journey,s:Stage,p:Progress):Stage{
 const plan=p.adventure?.sectionPlans?.[sectionKey(j,s)];
 if(!s.adaptiveReviews||!plan||plan.baseIds.length!==s.lessons.length||plan.baseIds.some((id,i)=>id!==s.lessons[i].id))return s;
 let review=0;return {...s,lessons:s.lessons.flatMap((l,i)=>plan.after.includes(i+1)?[l,{id:`${s.id}-recall-${++review}`,title:'Kocia powtórka',intro:'Krótki powrót do wcześniej poznanych rzeczy.',role:'recall' as const,targetCount:5,wordIds:[],exerciseIds:[],ruleIds:[]}]:[l])};
}
export const plannedJourney=(j:Journey,p:Progress):Journey=>({...j,stages:j.stages.map(s=>plannedStage(j,s,p))});
