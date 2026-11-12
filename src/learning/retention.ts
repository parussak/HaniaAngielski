import {keyFor,plainItem,type Item,type Module,type Progress,type Session} from './model.ts';
import {resolveItem} from './questions.ts';
import {finishStageReview} from '../stage-review.ts';

const cleanItem=plainItem;
export function memoryFor(p:Progress,key:string){
 if(p.adventure?.memory?.[key])return p.adventure.memory[key];
 const entries=Object.values(p.adventure?.stageReviews??{}).flatMap(s=>Object.values(s.items)).filter(e=>e.item.key===key);
 if(!entries.length)return;
 return {item:cleanItem(entries[0].item),correct:Math.min(...entries.map(e=>e.correct))};
}
export function rememberError(p:Progress,item:Item){
 p.adventure??={version:1,earned:0,purchases:{},completed:{}};
 (p.adventure.memory??={})[item.key]={item:cleanItem(item),correct:0};
}
export function errorItems(modules:Module[],p:Progress):Item[]{
 const all=new Map<string,Item>();
 for(const state of Object.values(p.adventure?.stageReviews??{}))for(const entry of Object.values(state.items))all.set(entry.item.key,entry.item);
 for(const entry of Object.values(p.adventure?.memory??{}))all.set(entry.item.key,entry.item);
 for(const m of modules){
  for(const w of m.words){const key=keyFor(m,'word',w.id);if(p.words[key]==='review'||p.difficult.includes(key))all.set(key,{key,moduleId:m.id,id:w.id,type:'word',version:w.rev??1,input:'text'});}
  for(const q of m.exercises){const key=keyFor(m,'exercise',q.id);if(p.difficult.includes(key))all.set(key,{key,moduleId:m.id,id:q.id,type:'exercise',version:q.rev??1,input:'text'});}
 }
 return [...all.values()].filter(item=>(memoryFor(p,item.key)?.correct??0)<3&&!!resolveItem(modules,item)).map(cleanItem);
}
/** Counts first answers once, only after a complete, locally stored session. */
export function finishRetention(p:Progress,s:Session){
 const saved=p.sessions.find(v=>v.id===s.id);
 if(!s.completedAt||!saved||saved.retentionCounted||!s.items.every(i=>s.attempts.some(a=>a.key===i.key)))return;
 const previous=new Map(s.items.map(item=>[item.key,memoryFor(p,item.key)??(p.difficult.includes(item.key)||p.words[item.key]==='review'?{item:cleanItem(item),correct:0}:undefined)]));
 finishStageReview(p,s);
 for(const a of s.attempts){
  const entry=previous.get(a.key);if(!entry)continue;
  const correct=a.first?Math.min(3,entry.correct+1):0;
  p.adventure??={version:1,earned:0,purchases:{},completed:{}};
  (p.adventure.memory??={})[a.key]={item:cleanItem(entry.item),correct};
  for(const state of Object.values(p.adventure.stageReviews??{}))if(state.items[a.key]){
   state.items[a.key].correct=correct;state.items[a.key].due=correct===3?0:Math.max(state.round+1,state.items[a.key].due);
  }
  if(correct===3){p.difficult=p.difficult.filter(k=>k!==a.key);if(p.words[a.key]==='review')p.words[a.key]='known';}
 }
 s.retentionCounted=true;saved.retentionCounted=true;
}
