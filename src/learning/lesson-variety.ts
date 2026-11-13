import type {Journey,Lesson} from '../adventure.ts';
import {questionFor,inputFor,shuffle,isCorrect} from './questions.ts';
import {mapTrainingPool} from './training.ts';
import type {Item,Module,Progress,Session} from './model.ts';
import {groupScenes} from './scenes.ts';
import {markListening} from './listening.ts';

/** Keep every source task; supplement only with already encountered earlier material. */
export function varyLesson(s:Session,modules:Module[],journeys:Journey[],j:Journey,l:Lesson,p:Progress,supplement=true){
 if(s.recall)return s; // Error reviews keep their writing/explicit-choice policy.
 // D-53: complete scenes keep their script order and authored answers; the rest is varied.
 groupScenes(modules,s,'end');
 const scenes=s.items.filter(i=>i.sceneGroup),items=s.items.filter(i=>!i.sceneGroup);
 // A story-only lesson stays a whole story, even when earlier practice is available.
 if(scenes.length>0&&items.length===0){s.answerMode='mixed';return s;}
 if(!s.training&&supplement){
  const vocabulary=(i:Item)=>questionFor(modules,i).kind==='vocabulary';
  const needsVocabulary=!items.some(vocabulary),needsGrammar=items.every(vocabulary);
  const pool=shuffle(mapTrainingPool(modules,journeys,j,p,l)).map(v=>v.item).filter(i=>!items.some(v=>v.key===i.key));
  const added=pool.filter(i=>needsVocabulary?vocabulary(i):needsGrammar&&!vocabulary(i)).slice(0,Math.max(0,Math.min(2,10-items.length-scenes.length)));
  items.push(...added);
 }
 const words=items.filter(i=>questionFor(modules,i).kind==='vocabulary'),other=items.filter(i=>!words.includes(i));
 const ordered:Item[]=[];while(words.length||other.length){if(words.length)ordered.push(words.shift()!);if(other.length)ordered.push(other.shift()!);}
 ordered.forEach((item,i)=>{delete item.options;delete item.pairGroup;delete item.gapGroup;delete item.presentation;delete item.listen;item.input=inputFor(questionFor(modules,item),i%2?'text':'choice');});
 const candidates=ordered.filter(i=>i.type==='word');
 const group=candidates.length>=3?candidates.slice(0,Math.min(3,candidates.length-1)):[];
 const targets=group.map(i=>questionFor(modules,i).answers[0]);
 if(group.length>=2&&new Set(targets).size===group.length&&new Set(group.map(i=>questionFor(modules,i).prompt)).size===group.length&&group.every(i=>targets.filter(answer=>isCorrect(questionFor(modules,i),answer)).length===1)){
  group.forEach(i=>{i.pairGroup=group[0].key;i.input='choice';});
  s.items=[...group,...ordered.filter(i=>!group.includes(i))];
  // Matching is followed by a writing task when the material permits it.
  const writing=s.items.find(i=>!i.pairGroup&&!questionFor(modules,i).responseType&&inputFor(questionFor(modules,i),'text')==='text');if(writing)writing.input='text';
 }else s.items=ordered;
 for(const item of s.items){const q=questionFor(modules,item);if(item.input==='choice'&&(q.dialogue||q.prompt.includes('___')))item.presentation='bank';}
 const gaps=s.items.filter(i=>i.presentation==='bank'),first=gaps[0],second=first&&gaps.find(i=>i!==first&&questionFor(modules,i).answers[0]!==questionFor(modules,first).answers[0]);
 if(first&&second){const group=[first,second],start=s.items.indexOf(first);group.forEach(i=>i.gapGroup=first.key);s.items=s.items.flatMap((i,index)=>index===start?group:group.includes(i)?[]:[i]);}
 // D-58: listening is assigned to the task itself; a device without sound shows its ordinary form.
 markListening(modules,s);
 s.items=[...s.items,...scenes];
 s.answerMode='mixed';return s;
}
