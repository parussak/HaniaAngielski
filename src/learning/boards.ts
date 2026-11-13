import {questionFor} from './questions.ts';
import {recordAnswer,next} from './session.ts';
import {rememberError} from './retention.ts';
import {recordStageError} from '../stage-review.ts';
import type {Journey} from './journey.ts';
import type {Module,Progress,Session} from './model.ts';
export function boardItems(s:Session){const current=s.items[s.index];return current.pairGroup?s.items.filter(i=>i.pairGroup===current.pairGroup):current.gapGroup?s.items.filter(i=>i.gapGroup===current.gapGroup):[current];}
export function solved(s:Session,key:string){return s.attempts.some(a=>a.key===key&&(a.first||a.corrected));}
export function settled(s:Session,key:string){return solved(s,key)||s.items.findIndex(i=>i.key===key)<s.index;}
export function gapTokens(modules:Module[],s:Session){return s.items[s.index].gapGroup?boardItems(s).slice().sort((a,b)=>a.key.localeCompare(b.key)).map(i=>questionFor(modules,i).answers[0]):questionFor(modules,s.items[s.index]).options;}
/** Placing checks once. Wrong tokens stay put and can be moved or returned without another attempt. */
export function placeGap(p:Progress,modules:Module[],journeys:Journey[],key:string,answer?:string){
 const s=p.active;if(!s||!['question','retry'].includes(s.phase)||s.items[s.index].presentation!=='bank')return;
 const group=boardItems(s),placements=s.gapPlacements??={};
 if(key&&!group.some(i=>i.key===key)||key&&solved(s,key))return;
 if(answer===undefined){s.gapSelection=placements[key];return;}
 if(!gapTokens(modules,s).includes(answer)||group.some(i=>solved(s,i.key)&&placements[i.key]===answer))return;
 if(key&&placements[key]===answer)return;
 for(const [other,value] of Object.entries(placements))if(value===answer)delete placements[other];
 delete s.gapSelection;delete s.draftAnswer;
 if(!key)return;
 placements[key]=answer;
 return answerOnBoard(p,modules,journeys,key,answer);
}
/** One answer per original key. Wrong matches stay on this finite board. */
export function answerOnBoard(p:Progress,modules:Module[],journeys:Journey[],key:string,answer:string){
 const s=p.active;if(!s||!['question','retry'].includes(s.phase)||!boardItems(s).some(i=>i.key===key)||solved(s,key))return;
 s.phase='question';
 const index=s.items.findIndex((i,n)=>n>=s.index&&i.key===key);if(index<0)return;
 [s.items[s.index],s.items[index]]=[s.items[index],s.items[s.index]];
 const item=s.items[s.index],ok=recordAnswer(p,questionFor(modules,item),answer);
 delete s.pairSelection;delete s.draftAnswer;delete s.gapSelection;
 if(ok===false){rememberError(p,item);recordStageError(p,s,item,journeys);s.phase='question';s.lastCorrect=null;return false;}
 const group=boardItems(s),remaining=group.some(i=>s.items.indexOf(i)>s.index&&!solved(s,i.key));
 if(remaining){next(p);}else{s.boardSummary=true;s.phase='feedback';s.lastCorrect=true;}
 return true;
}
