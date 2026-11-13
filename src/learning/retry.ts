import type {Progress} from './model.ts';

/** Reopen one failed answer without erasing its first attempt or changing rewards. */
export function retryAnswer(p:Progress,key?:string){
 const s=p.active;if(!s)return false;
 const current=s.items[s.index],ordinary=!key;
 if(!key){if(s.phase!=='feedback'||s.lastCorrect!==false)return false;key=current.key;}
 const target=ordinary?s.index:s.items.findIndex(i=>i.key===key),item=s.items[target],attempt=s.attempts.find(a=>a.key===key);
 if(!item||!attempt||!ordinary&&(attempt.first||attempt.corrected))return false;
 if(item!==current&&!((current.sceneGroup&&item.sceneGroup===current.sceneGroup)||(current.pairGroup&&item.pairGroup===current.pairGroup)||(current.gapGroup&&item.gapGroup===current.gapGroup)))return false;
 s.index=target;s.phase='retry';s.lastCorrect=null;delete s.boardSummary;delete s.draftAnswer;delete s.gapSelection;
 if(item.presentation==='bank'&&s.gapPlacements)delete s.gapPlacements[key];
 if(item.pairGroup){s.phase='question';s.pairSelection=key;}
 return true;
}
