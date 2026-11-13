import {normalizeAnswer} from '../answers.ts';
import {questionFor} from './questions.ts';
import {vocabularyFullAnswer} from './vocabulary-answer.ts';
import type {Illustration,Item,Module,Session} from './model.ts';

/**
 * D-58: listening is another way of showing a vocabulary item. The item, its answers
 * and its grading stay exactly the same, so a device without sound can show the
 * ordinary form of the very same task. Nothing here knows a course or a module.
 */
export const dictationWords=3;
export interface ListeningTask {
 /** Spoken text: the full expected answer, with its article when the entry has one. */
 text:string;
 language:string;
 /** Listen and choose: every answer option shown as its meaning, never as the written answer. */
 choices?:{answer:string;label:string;illustration?:Illustration}[];
}
const body=(text:string)=>normalizeAnswer(text).replace(/^(a|an)\s+/,'');

/** Voluntary pronunciation after answering: also long phrases and vocabulary quiz items. */
export function vocabularyPlayback(modules:Module[],item:Item):ListeningTask|undefined {
 const m=modules.find(m=>m.id===item.moduleId);if(!m?.languageCode)return;
 let q;try{q=questionFor(modules,item);}catch{return;}
 return q.kind==='vocabulary'?{text:vocabularyFullAnswer(q),language:m.languageCode}:undefined;
}

/** What to say for this item, or undefined when it has to be shown in its ordinary form. */
export function listeningTask(modules:Module[],item:Item):ListeningTask|undefined{
 if(!item.listen||item.type!=='word')return;
 const m=modules.find(m=>m.id===item.moduleId);if(!m?.languageCode)return;
 let q;try{q=questionFor(modules,item);}catch{return;}
 const text=vocabularyFullAnswer(q);
 if(item.input==='text')return text.trim().split(/\s+/).length<=dictationWords?{text,language:m.languageCode}:undefined;
 // An option can be shown as a meaning only when it is itself an entry of the module.
 const choices=q.options.map(answer=>{const word=m.words.find(w=>[w.back,...(w.answers??[])].some(a=>body(a)===body(answer)));return word&&{answer,label:word.front,illustration:word.illustration};});
 if(choices.some(c=>!c)||new Set(choices.map(c=>c!.label)).size!==choices.length)return;
 return {text,language:m.languageCode,choices:choices as NonNullable<ListeningTask['choices']>};
}

/** At most two plain vocabulary items of a new session get listening: one to choose, one to type. */
export function markListening(modules:Module[],s:Pick<Session,'items'>){
 for(const item of s.items)delete item.listen;
 for(const input of ['choice','text'] as const){
  for(const item of s.items){
   if(item.type!=='word'||item.input!==input||item.pairGroup||item.gapGroup||item.sceneGroup||item.presentation||item.options)continue;
   item.listen=true;
   if(listeningTask(modules,item))break;
   delete item.listen;
  }
 }
 return s;
}
