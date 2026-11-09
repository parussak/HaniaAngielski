import {freshAdventure,lessonKey,type Journey,type Stage} from './adventure.ts';
import {inputFor,questionFor,resolveItem,type Progress,type Session,type Module,type Item,type AnswerMode} from './core.ts';
import type {HistoryPage} from './history.ts';

export interface ReviewItem {item:Item;correct:number;due:number}
export interface StageReview {round:number;items:Record<string,ReviewItem>;rewardedAt?:string}
export const stageKey=(j:Journey,stage:Stage)=>`${j.moduleId}/${stage.id}`;
export function reviewState(p:Progress,id:string):StageReview|undefined{return p.adventure?.stageReviews?.[id];}
function ensure(p:Progress,id:string){const a=p.adventure??freshAdventure();a.stageReviews??={};a.stageReviews[id]??={round:0,items:{}};p.adventure=a;return a.stageReviews[id];}
export function stageForSession(journeys:Journey[],s:Session){
  for(const journey of journeys)for(const stage of journey.stages){
    const key=stageKey(journey,stage);
    if(s.stageReview?.id===key || s.lesson&&stage.lessons.some(l=>lessonKey(journey,l)===s.lesson!.id))return {journey,stage,key};
  }
}
function collect(p:Progress,id:string,item:Item,reset:boolean){
  const state=ensure(p,id),old=state.items[item.key];
  if(reset||!old)state.items[item.key]={item:structuredClone(item),correct:0,due:state.round+1};
}
export function recordStageError(p:Progress,s:Session,item:Item,journeys:Journey[]){const context=stageForSession(journeys,s);if(context)collect(p,context.key,item,true);}
function seedSessions(p:Progress,sessions:Session[],journeys:Journey[]){
  for(const s of sessions){const context=stageForSession(journeys,s);if(!context)continue;
    for(const a of s.attempts.filter(a=>!a.first)){const item=s.items.find(i=>i.key===a.key);if(item)collect(p,context.key,item,false);}
  }
}
// Upgrade once. Raw archived lesson answers are read separately, with a saved
// cursor, so a missing offline chunk never blocks learning or invents mastery.
export function seedStageReviews(input:Progress,journeys:Journey[]):Progress {
  if(!journeys.length||input.adventure?.reviewSchema===1)return input;
  if(!input.adventure&&!input.active?.lesson&&!input.sessions.some(s=>s.lesson))return input;
  const p=structuredClone(input);p.adventure??=freshAdventure();
  seedSessions(p,[...p.sessions,...(p.active?[p.active]:[])],journeys);
  p.adventure.reviewSchema=1;
  p.adventure.reviewArchiveHead=Object.keys(p.adventure.completed).length?(p.history?.head??null):null;
  return p;
}
export function seedReviewArchive(p:Progress,page:HistoryPage,journeys:Journey[]){
  if(p.adventure?.reviewArchiveHead!==page.id)return false;
  seedSessions(p,page.sessions,journeys);p.adventure.reviewArchiveHead=page.previous;return true;
}
export function reviewStats(p:Progress,j:Journey,stage?:Stage){
  const states=(stage?[stage]:j.stages).map(s=>reviewState(p,stageKey(j,s)));
  const unique=new Map<string,ReviewItem>();
  for(const state of states)for(const entry of Object.values(state?.items??{})){
    const previous=unique.get(entry.item.key);if(!previous||entry.correct<previous.correct)unique.set(entry.item.key,entry);
  }
  const entries=[...unique.values()],pending=entries.filter(e=>e.correct<3),mastered=entries.length-pending.length;
  return {total:entries.length,pending:pending.length,mastered,percent:entries.length?Math.floor(mastered/entries.length*100):100,words:pending.filter(e=>e.item.type==='word').length,tasks:pending.filter(e=>e.item.type==='exercise').length};
}
const plural=(n:number,one:string,few:string,many:string)=>`${n} ${n===1?one:n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?few:many}`;
export function pendingLabel(stats:{words:number;tasks:number}){return [stats.words?plural(stats.words,'słówko','słówka','słówek'):'',stats.tasks?plural(stats.tasks,'zadanie','zadania','zadań'):''].filter(Boolean).join(' i ');}
export function makeStageReviewSession(modules:Module[],j:Journey,stage:Stage,_answerMode:AnswerMode,p:Progress):Session|null{
  const state=reviewState(p,stageKey(j,stage));
  const remaining=Object.values(state?.items??{}).filter(e=>e.correct<3);
  if(!state||!remaining.length)return null;
  if(remaining.some(e=>!resolveItem(modules,e.item)))throw new Error('Część powtórki wymaga wcześniejszej wersji materiałów. Zapisane wyniki pozostają zachowane.');
  const round=Math.max(state.round+1,Math.min(...remaining.map(e=>e.due)));
  const items=remaining.filter(e=>e.due<=round).sort((a,b)=>a.correct-b.correct||a.due-b.due||a.item.key.localeCompare(b.item.key)).slice(0,10).map(e=>structuredClone(e.item));
  items.forEach(item=>item.input=inputFor(questionFor(modules,item),'text','review'));
  return {id:crypto.randomUUID(),moduleId:j.moduleId,mode:'review',stageReview:{id:stageKey(j,stage),title:`Powtórka · ${stage.title}`,round},answerMode:'text',previous:false,startedAt:new Date().toISOString(),completedAt:null,items,index:0,phase:'question',lastCorrect:null,attempts:[],repeatKeys:[]};
}
export function finishStageReview(p:Progress,s:Session){
  if(!s.stageReview||!s.completedAt||!s.items.every(i=>s.attempts.some(a=>a.key===i.key)))return false;
  const state=reviewState(p,s.stageReview.id),round=s.stageReview.round;
  if(!state||state.round>=round)return false;
  for(const a of s.attempts){const entry=state.items[a.key];if(!entry)continue;
    if(a.first){entry.correct=Math.min(3,entry.correct+1);entry.due=entry.correct===3?0:round+(entry.correct===1?2:3);}
    else {entry.correct=0;entry.due=round+1;}
  }
  state.round=round;return true;
}
export function settleStageRewards(p:Progress,journeys:Journey[],at=new Date().toISOString()){
  if(p.adventure?.reviewArchiveHead)return 0;
  let reward=0;
  for(const j of journeys)for(const stage of j.stages){
    if(!stage.lessons.every(l=>p.adventure?.completed[lessonKey(j,l)]))continue;
    if(reviewStats(p,j,stage).pending || reviewState(p,stageKey(j,stage))?.rewardedAt)continue;
    const state=ensure(p,stageKey(j,stage));state.rewardedAt=at;p.adventure!.earned+=3;reward+=3;
  }
  return reward;
}
