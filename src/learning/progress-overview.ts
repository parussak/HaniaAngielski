import {journeyForProgress,journeyKey,lessons,type Journey,type JourneyIssue} from '../adventure.ts';
import {courseKey} from './scope.ts';
import {resolveItem} from './questions.ts';
import type {Module,Progress,Session} from './model.ts';

const dayKey=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const hasAnswer=(s:Session)=>s.attempts.some(a=>a.answer.trim()||(a.lastAnswer??'').trim());
export function courseProgressOverview(modules:Module[],journeys:Journey[],issues:JourneyIssue[],p:Progress,courseId:string,older:Session[]=[],now=new Date()){
 const scoped=modules.filter(m=>courseKey(m)===courseId),ids=new Set(scoped.map(m=>m.id));
 const belongs=(s:Session)=>s.scope?s.scope.courseId===courseId:ids.has(s.moduleId);
 const recent=p.sessions.filter(belongs);
 const sessions=[...new Map([...p.sessions,...older].filter(belongs).map(s=>[s.id,s])).values()].sort((a,b)=>Date.parse(b.completedAt!)-Date.parse(a.completedAt!));
 const archived=scoped.reduce((n,m)=>n+(p.history?.modules[m.id]?.sessions??0),0)+(p.history?.courses?.[courseId]?.sessions??0);
 const maps=journeys.filter(j=>ids.has(j.moduleId)).map(raw=>{
  const journey=journeyForProgress(raw,p),entries=lessons(journey),done=entries.filter(l=>p.adventure?.completed[l.key]).length;
  return {journey,key:journeyKey(journey),done,total:entries.length,complete:entries.length>0&&done===entries.length,percent:entries.length?Math.floor(done/entries.length*100):0};
 });
 const incompleteLibrary=scoped.some(m=>issues.some(i=>i.moduleId===m.id)||maps.filter(v=>v.journey.moduleId===m.id).length<(m.journeyPaths?.length??1));
 const monday=new Date(now);monday.setHours(0,0,0,0);monday.setDate(monday.getDate()-(monday.getDay()+6)%7);
 const dated=sessions.filter(s=>s.completedAt&&Date.parse(s.completedAt)<=now.getTime()&&hasAnswer(s));
 const week=Array.from({length:7},(_,i)=>{const day=new Date(monday);day.setDate(day.getDate()+i);const key=dayKey(day);return {key,date:day,active:dated.some(s=>dayKey(new Date(s.completedAt!))===key),today:key===dayKey(now),future:day>now};});
 const weeklySessions=dated.filter(s=>Date.parse(s.completedAt!)>=monday.getTime()).length;
 // Recent successes are not a mastery score. Archived summaries cannot recover corrections or answer text.
 const seen=new Set(Object.entries(p.history?.items??{}).filter(([,v])=>v.correct>0).map(([key])=>key)),returns=new Set<string>(),corrections=new Set<string>(),words=new Set<string>(),stories=new Set<string>();
 for(const s of [...recent].sort((a,b)=>Date.parse(a.completedAt!)-Date.parse(b.completedAt!))){
  for(const a of s.attempts){
   if(!a.answer.trim()&&!(a.lastAnswer??'').trim())continue;
   const item=s.items.find(i=>i.key===a.key),data=item&&resolveItem(scoped,item);if(!item||!data)continue;
   if(seen.has(a.key)&&a.first)returns.add(a.key);seen.add(a.key);
   if(!a.first&&a.corrected)corrections.add(a.key);
   if(item.type==='word')words.add(`${item.moduleId}:${item.id}`);
   else if('wordId' in data&&data.wordId)words.add(`${item.moduleId}:${data.wordId}`);
  }
  if(s.lesson&&s.items.some(i=>i.sceneGroup&&s.attempts.some(a=>a.key===i.key&&(a.answer.trim()||(a.lastAnswer??'').trim()))))stories.add(s.lesson.id);
 }
 return {modules:scoped,maps,sessions,recent,totalSessions:recent.length+archived,archived,incompleteLibrary,week,weeklySessions,activeDays:week.filter(d=>d.active).length,
  done:maps.reduce((n,m)=>n+m.done,0),total:maps.reduce((n,m)=>n+m.total,0),completeMaps:maps.filter(m=>m.complete).length,
  recentSuccess:{returns:returns.size,corrections:corrections.size,words:words.size,stories:stories.size},belongs};
}
