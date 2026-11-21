import {normalizeAnswer} from '../answers.ts';
import {languageCode} from '../materials/validation.ts';
import type {Exercise,Reading,ReadingQuestion} from './model.ts';

/**
 * D-68: the authored format of a reading. Authors write the reading once and every
 * question becomes an ordinary choice exercise (`kind: "reading"`), like the gaps of
 * a dialogue scene (D-53). Nothing here knows a course, module or language.
 */
const fail=(message:string):never=>{throw new Error(`Błąd materiałów: ${message}`);};
const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const text=(v:unknown):v is string=>typeof v==='string'&&v.trim().length>0;
const texts=(v:unknown):v is string[]=>Array.isArray(v)&&v.length>0&&v.every(text);
const id=(v:unknown):v is string=>typeof v==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
const language=languageCode;
const word=/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;

/** Words of a sentence, each once, in reading order — the choices of a tap question. */
export function readingTokens(sentence:string){
 const seen=new Set<string>(),tokens:string[]=[];
 for(const token of sentence.match(word)??[]){
  const key=normalizeAnswer(token);
  if(seen.has(key))continue;
  seen.add(key);
  tokens.push(token);
 }
 return tokens;
}
/** A sentence cut into words and the text between them, for tappable words on screen. */
export function readingParts(sentence:string){
 const parts:{text:string;word:boolean}[]=[];
 let last=0;
 for(const match of sentence.matchAll(word)){
  if(match.index>last)parts.push({text:sentence.slice(last,match.index),word:false});
  parts.push({text:match[0],word:true});
  last=match.index+match[0].length;
 }
 if(last<sentence.length)parts.push({text:sentence.slice(last),word:false});
 return parts;
}

/** Split a prompt at glossary terms, preferring the longest phrase at each position. */
export function questionGlossaryParts(prompt:string,glossary:Record<string,string>={}){
 const terms=Object.keys(glossary).sort((a,b)=>b.length-a.length);
 const parts:{text:string;term?:string}[]=[];
 if(!terms.length)return [{text:prompt}];
 const byText=new Map(terms.map(term=>[term.toLowerCase(),term]));
 const alternatives=terms.map(term=>term.replace(/[.*+?^{}()|[\]\\]/g,'\\$&')).join('|');
 const pattern=new RegExp('(?<![\\p{L}\\p{M}\\p{N}])(?:'+alternatives+')(?![\\p{L}\\p{M}\\p{N}])','giu');
 let last=0;
 for(const match of prompt.matchAll(pattern)){
  if(match.index>last)parts.push({text:prompt.slice(last,match.index)});
  parts.push({text:match[0],term:byText.get(match[0].toLowerCase())});
  last=match.index+match[0].length;
 }
 if(last<prompt.length)parts.push({text:prompt.slice(last)});
 return parts;
}

function validQuestionGlossary(prompt:string,glossary:unknown):glossary is Record<string,string>{
 if(!obj(glossary))return false;
 const terms=Object.keys(glossary);
 const promptWords=prompt.match(word)?.length??0;
 if(!terms.every(term=>{
  const words=term.match(word)?.length??0;
  return text(glossary[term])&&term===term.trim()&&words>0&&words<promptWords;
 }))return false;
 const shown=new Set(questionGlossaryParts(prompt,glossary as Record<string,string>).map(part=>part.term));
 return terms.every(term=>shown.has(term));
}

/** Turns one authored reading into its text and one exercise per question. */
export function compileReading(entry:unknown,metadata:{languageCode?:string}={}):{reading:Reading;exercises:Exercise[]}{
 if(!obj(entry)||!id(entry.id))return fail('czytanka wymaga identyfikatora z małych liter, cyfr i myślników.');
 const where=`czytanka ${entry.id}`;
 if(!text(entry.title)||entry.title.length>80)return fail(`${where}: wymagany tytuł do 80 znaków.`);
 if(!language(entry.questionLanguage)||metadata.languageCode!==undefined&&entry.questionLanguage!==metadata.languageCode)return fail(`${where}: język pytań (questionLanguage) musi być językiem tekstu czytanki, czyli językiem kursu.`);
 const sentences=entry.sentences;
 if(!Array.isArray(sentences)||sentences.length<2||sentences.length>40)return fail(`${where}: czytanka wymaga od 2 do 40 zdań.`);
 if(!sentences.every(s=>obj(s)&&id(s.id)&&text(s.text)&&s.text.length<=300&&!s.text.includes('___')&&text(s.translation)))return fail(`${where}: każde zdanie wymaga id i tekstu do 300 znaków; tłumaczenie (translation) jest obowiązkowe.`);
 const script=sentences as {id:string;text:string;translation:string}[];
 if(new Set(script.map(s=>s.id)).size!==script.length)return fail(`${where}: powtórzony identyfikator zdania.`);
 const glossary=entry.glossary;
 if(glossary!==undefined&&(!obj(glossary)||!Object.entries(glossary).every(([key,value])=>text(key)&&text(value))||new Set(Object.keys(glossary).map(key=>normalizeAnswer(key))).size!==Object.keys(glossary).length))return fail(`${where}: niepoprawna lista słów (glossary).`);
 if(!text(entry.source))return fail(`${where}: brak źródła (source).`);
 const questions=entry.questions;
 if(!Array.isArray(questions)||questions.length<1||questions.length>6)return fail(`${where}: czytanka wymaga od 1 do 6 pytań.`);
 const at=(sentenceId:unknown)=>script.findIndex(s=>s.id===sentenceId);
 let previous=0;
 const exercises=questions.map((q,index):Exercise=>{
  if(!obj(q)||!id(q.id))return fail(`${where}: każde pytanie wymaga identyfikatora.`);
  const ask=`${where}, pytanie ${q.id}`;
  if(!['choice','tap'].includes(q.type as string)||!text(q.prompt)||!texts(q.answers)||!text(q.explanation))return fail(`${ask}: wymagane type "choice" lub "tap", polecenie, odpowiedzi i wyjaśnienie.`);
  const after=at(q.after);
  if(after<0)return fail(`${ask}: after musi wskazywać zdanie czytanki.`);
  if(after<previous)return fail(`${ask}: pytania muszą być w kolejności czytania (after).`);
  previous=after;
  const answers=q.answers as string[];
  let options:string[],sentence:string|undefined;
  if(q.type==='tap'){
   const target=at(q.sentence);
   if(target<0||target>after)return fail(`${ask}: sentence musi wskazywać zdanie przeczytane przed pytaniem.`);
   sentence=script[target].id;
   options=readingTokens(script[target].text);
   if(!answers.every(answer=>options.some(token=>normalizeAnswer(token)===normalizeAnswer(answer))))return fail(`${ask}: każde słowo z answers musi występować w zdaniu sentence.`);
  }else{
   if(!texts(q.options)||q.options.length<2)return fail(`${ask}: pytanie wyboru wymaga co najmniej dwóch opcji.`);
   options=q.options as string[];
  }
  const refs=q.refs===undefined?[sentence??script[after].id]:q.refs;
  if(!Array.isArray(refs)||!refs.length||new Set(refs).size!==refs.length||!refs.every(ref=>at(ref)>=0&&at(ref)<=after))return fail(`${ask}: refs mogą wskazywać tylko zdania do after włącznie.`);
  const questionGlossary=q.glossary;
  if(questionGlossary!==undefined&&!validQuestionGlossary(q.prompt as string,questionGlossary))return fail(`${ask}: glossary musi tłumaczyć widoczne słowa lub zwroty z pytania.`);
  const reading:ReadingQuestion={id:entry.id as string,question:index,type:q.type as 'choice'|'tap',after:script[after].id,...(sentence?{sentence}:{}),refs:refs as string[],...(questionGlossary?{glossary:{...questionGlossary}}:{})};
  return {id:`${entry.id}--${q.id}`,kind:'reading',responseType:'choice',prompt:q.prompt as string,answers,options,explanation:q.explanation as string,requires:entry.requires as string[],caseSensitive:false,source:entry.source as string,
   ...(q.ruleId!==undefined?{ruleId:q.ruleId as string}:{}),...(q.rev!==undefined?{rev:q.rev as number}:{}),reading};
 });
 if(new Set(exercises.map(q=>q.id)).size!==exercises.length)return fail(`${where}: powtórzony identyfikator pytania.`);
 return {reading:{id:entry.id,title:entry.title,questionLanguage:entry.questionLanguage,sentences:script.map(s=>({id:s.id,text:s.text,translation:s.translation})),...(glossary?{glossary:{...glossary} as Record<string,string>}:{}),questionIds:exercises.map(q=>q.id)},exercises};
}

/** Structural check of compiled readings; the question exercises are checked like any exercise. */
export function validateReadings(m:{id:unknown;readings?:unknown;exercises:unknown[]}){
 const exercises=m.exercises as Exercise[];
 if(m.readings!==undefined&&!Array.isArray(m.readings))return fail(`niepoprawna lista czytanek (${m.id}).`);
 const readings=(m.readings??[]) as Reading[];
 if(new Set(readings.map(r=>r?.id)).size!==readings.length)return fail(`powtórzony identyfikator czytanki (${m.id}).`);
 for(const r of readings){
  if(!obj(r)||!id(r.id)||!text(r.title)||!language(r.questionLanguage)||!Array.isArray(r.sentences)||r.sentences.length<2||!r.sentences.every(s=>obj(s)&&id(s.id)&&text(s.text)&&text(s.translation))||!Array.isArray(r.questionIds)||r.questionIds.length<1||r.questionIds.length>6)return fail(`niepoprawna czytanka (${m.id}/${(r as Reading)?.id??'?'}).`);
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

