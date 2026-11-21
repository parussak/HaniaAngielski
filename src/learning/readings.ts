import {normalizeAnswer} from '../answers.ts';
import {knownMaterial} from './known-material.ts';
import {keyFor,type Exercise,type Item,type Module,type Progress,type Reading,type ReadingQuestion,type Session} from './model.ts';

/**
 * D-68: a reading in a session — shown sentence by sentence, with questions woven in.
 * The questions of one reading are grouped by the scene marker (`sceneGroup`); which
 * sentence is on screen is not saved — it follows from the answered questions.
 * The authored format is in `reading-format.ts`. Nothing here knows a course, module or language.
 */
/** The reading of one session item, when the item is a reading question of the current content. */
export function readingOf(modules:Module[],item:Item){
 if(item.type!=='exercise')return;
 const module=modules.find(m=>m.id===item.moduleId);
 const question=module?.exercises.find(q=>q.id===item.id&&(q.rev??1)===item.version);
 const reading=question?.reading&&module!.readings?.find(r=>r.id===question.reading!.id);
 return reading?{module:module!,reading,question:question!}:undefined;
}

type Next={advance:boolean;shown:number}|'finish'|null;
export type ReadingStatus='hidden'|'open'|'answered';
/**
 * The reading on screen. `shown` is the screen's own sentence counter; without it
 * (after a refresh) the text returns to the last answered question. The counter
 * never passes an unanswered question.
 */
export function readingView(modules:Module[],s:Session,shown?:number){
 const current=s.items[s.index];
 if(!current?.sceneGroup)return;
 const found=readingOf(modules,current);
 if(!found)return;
 const {reading,module}=found;
 const items=s.items.filter(i=>i.sceneGroup===current.sceneGroup);
 if(items.length!==reading.questionIds.length||items.some((item,index)=>item.id!==reading.questionIds[index]))return;
 const questions=items.map(item=>readingOf(modules,item)?.question);
 if(questions.some(q=>!q?.reading))return;
 const asked=questions as (Exercise&{reading:ReadingQuestion})[];
 const at=(index:number)=>reading.sentences.findIndex(x=>x.id===asked[index].reading.after);
 const tried=(index:number)=>s.attempts.some(a=>a.key===items[index].key);
 const position=items.indexOf(current),total=reading.sentences.length;
 const pending=items.findIndex((_,index)=>!tried(index));
 const answeredUpTo=Math.max(1,...items.map((_,index)=>tried(index)?at(index)+1:0));
 const limit=!tried(position)||pending>=0?at(position)+1:total;
 const visible=Math.min(Math.max(answeredUpTo,shown??0),Math.max(limit,answeredUpTo));
 const open=s.phase!=='feedback',questionOpen=open&&at(position)<visible;
 const currentQuestion=asked[position].reading;
 const tapSentence=questionOpen&&currentQuestion.type==='tap'?currentQuestion.sentence:undefined;
 const status=(index:number):ReadingStatus=>index===position?(open?(questionOpen?'open':'hidden'):'answered'):tried(index)?'answered':'hidden';
 let next:Next;
 if(questionOpen)next=null;
 else if(open)next={advance:false,shown:visible+1};
 else if(pending>=0)next={advance:true,shown:at(pending)>=visible?visible+1:visible};
 else if(visible<total)next={advance:false,shown:visible+1};
 else if(position<items.length-1)next={advance:true,shown:visible};
 else next='finish';
 return {reading,module,items,position,visible,newest:reading.sentences[visible-1].id,questionOpen,tapSentence,next,
  questions:asked.map((q,index)=>({item:items[index],question:q,status:status(index)}))};
}

/** „Dalej” after an answered question: on to the next unanswered one, or back to the last one at the end. */
export function advanceReading(p:Progress,modules:Module[]){
 const s=p.active;
 if(!s||s.phase!=='feedback')return false;
 const view=readingView(modules,s);
 if(!view)return false;
 const pending=view.items.find(i=>!s.attempts.some(a=>a.key===i.key));
 if(pending){s.index=s.items.indexOf(pending);s.phase='question';s.lastCorrect=null;return true;}
 const last=view.items.at(-1)!;
 if(s.items[s.index]===last)return false;
 const attempt=s.attempts.find(a=>a.key===last.key)!;
 s.index=s.items.indexOf(last);
 s.lastCorrect=attempt.first||attempt.corrected;
 return true;
}

/** A question outside its reading (a review, a mixed session): the sentences it is about. */
export function readingContext(modules:Module[],item:Item){
 const found=readingOf(modules,item);
 if(!found)return;
 const {reading,question}=found,meta=question.reading!;
 const refs=meta.type==='tap'?new Set([...meta.refs,meta.sentence!]):new Set(meta.refs);
 return {reading,sentences:[...refs].map(ref=>reading.sentences.find(s=>s.id===ref)!),question,...(meta.type==='tap'?{tapSentence:meta.sentence!}:{})};
}

/** Tap translation: the word from the module vocabulary, then from the reading's list, otherwise the whole sentence. */
export function translateInReading(module:Pick<Module,'words'>,reading:Reading,sentenceId:string,tapped?:string){
 const sentence=reading.sentences.find(s=>s.id===sentenceId);
 if(!sentence)return;
 const token=tapped===undefined?'':normalizeAnswer(tapped);
 if(token){
  const known=module.words.find(w=>[w.back,...w.answers??[]].some(a=>normalizeAnswer(a)===token));
  if(known)return {text:known.front,from:'vocabulary' as const};
  const listed=Object.entries(reading.glossary??{}).find(([key])=>normalizeAnswer(key)===token);
  if(listed)return {text:listed[1],from:'glossary' as const};
 }
 return {text:sentence.translation,from:'sentence' as const};
}

/** Readings of the module the learner has already met — those can be read again in „Czytanki”. */
export function knownReadings(modules:Module[],module:Module,p:Progress){
 const known=knownMaterial(modules,module,p).exercises;
 return (module.readings??[]).filter(r=>r.questionIds.some(questionId=>known.has(keyFor(module,'exercise',questionId))));
}

/** „Czytanki”: one known reading, whole, as its own session. */
export function makeReadingSession(modules:Module[],module:Module,readingId:string,p:Progress):Session|null{
 const reading=knownReadings(modules,module,p).find(r=>r.id===readingId);
 if(!reading)return null;
 const items:Item[]=reading.questionIds.map(questionId=>({key:keyFor(module,'exercise',questionId),moduleId:module.id,version:module.exercises.find(q=>q.id===questionId)?.rev??1,type:'exercise',id:questionId,input:'choice'}));
 for(const item of items)item.sceneGroup=items[0].key;
 return {fixedLength:true,id:crypto.randomUUID(),moduleId:module.id,mode:'reading',answerMode:'choice',previous:false,startedAt:new Date().toISOString(),completedAt:null,items,index:0,phase:'question',lastCorrect:null,attempts:[],repeatKeys:[]};
}
