import {fail,obj,id,text,language,readingIllustration} from './reading-format.ts';
import type {Exercise,Reading} from './model.ts';

/** Structural check of compiled readings; the question exercises are checked like any exercise. */
export function validateReadings(m:{id:unknown;readings?:unknown;exercises:unknown[]}){
 const exercises=m.exercises as Exercise[];
 if(m.readings!==undefined&&!Array.isArray(m.readings))return fail(`niepoprawna lista czytanek (${m.id}).`);
 const readings=(m.readings??[]) as Reading[];
 if(new Set(readings.map(r=>r?.id)).size!==readings.length)return fail(`powtórzony identyfikator czytanki (${m.id}).`);
 for(const r of readings){
  if(!obj(r)||!id(r.id)||!text(r.title)||!language(r.questionLanguage)||!Array.isArray(r.sentences)||r.sentences.length<2||!r.sentences.every(s=>obj(s)&&id(s.id)&&text(s.text)&&text(s.translation))||!Array.isArray(r.questionIds)||r.questionIds.length<1||r.questionIds.length>6)return fail(`niepoprawna czytanka (${m.id}/${(r as Reading)?.id??'?'}).`);
  if(r.illustration!==undefined&&(!text(r.illustration)||!readingIllustration.test(r.illustration)))return fail(`niepoprawna ilustracja czytanki ${r.id}.`);
  r.questionIds.forEach((questionId,index)=>{
   const q=exercises.find(q=>q.id===questionId),known=(sentenceId:unknown)=>r.sentences.some(s=>s.id===sentenceId);
   if(!q||q.kind!=='reading'||q.reading?.id!==r.id||q.reading.question!==index||!known(q.reading.after)||!q.reading.refs.every(known)||q.reading.type==='tap'&&!known(q.reading.sentence))fail(`czytanka ${r.id}: brak zadania dla pytania ${questionId}.`);
  });
 }
 for(const q of exercises){
  if((q.kind==='reading')!==(q.reading!==undefined))return fail(`zadanie ${q.id}: pytanie czytanki wymaga rodzaju "reading".`);
  if(q.reading!==undefined&&readings.find(r=>r.id===q.reading!.id)?.questionIds[q.reading.question]!==q.id)return fail(`zadanie ${q.id} wskazuje nieistniejącą czytankę.`);
 }
}
