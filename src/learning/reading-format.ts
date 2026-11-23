import {readingTokens,questionGlossaryParts,readingWord} from './reading-words.ts';
import {normalizeAnswer} from '../answers.ts';
import {languageCode} from '../materials/validation.ts';
import type {Exercise,Reading,ReadingQuestion} from './model.ts';

export {readingTokens,readingParts,questionGlossaryParts} from './reading-words.ts';

/**
 * D-68: the authored format of a reading. Authors write the reading once and every
 * question becomes an ordinary choice exercise (`kind: "reading"`), like the gaps of
 * a dialogue scene (D-53). Nothing here knows a course, module or language.
 */
export const fail=(message:string):never=>{throw new Error(`Błąd materiałów: ${message}`);};
export const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
export const text=(v:unknown):v is string=>typeof v==='string'&&v.trim().length>0;
export const texts=(v:unknown):v is string[]=>Array.isArray(v)&&v.length>0&&v.every(text);
export const id=(v:unknown):v is string=>typeof v==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
export const language=languageCode;
export const readingIllustration=/^illustrations\/[a-z0-9-]+\.(?:svg|png)$/;
const word=readingWord;

const maxTapOptions=5;


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
 const illustration=entry.illustration;
 if(illustration!==undefined&&(!text(illustration)||!readingIllustration.test(illustration)))return fail(`${where}: illustration musi wskazywać plik SVG lub PNG w illustrations/.`);
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
   const tokens=readingTokens(script[target].text),words=new Set(tokens.map(token=>normalizeAnswer(token)));
   const correct=new Set(answers.map(answer=>normalizeAnswer(answer)));
   if(![...correct].every(answer=>words.has(answer)))return fail(`${ask}: każde słowo z answers musi występować w zdaniu sentence.`);
   if(q.options===undefined){
    // Older texts have no authored options. Keep the answer and preserve sentence order.
    const others=tokens.filter(token=>!correct.has(normalizeAnswer(token))).slice(0,Math.max(0,maxTapOptions-correct.size));
    const selected=new Set([...correct,...others.map(token=>normalizeAnswer(token))]);
    options=tokens.filter(token=>selected.has(normalizeAnswer(token)));
   }else{
    if(!texts(q.options))return fail(`${ask}: options musi zawierać słowa ze zdania sentence.`);
    options=q.options;
   }
   const selected=new Set(options.map(option=>normalizeAnswer(option)));
   if(options.length>maxTapOptions||selected.size!==options.length||[...selected].some(option=>!words.has(option))||[...correct].some(answer=>!selected.has(answer)))return fail(`${ask}: options musi zawierać najwyżej pięć różnych słów ze zdania sentence, w tym poprawną odpowiedź.`);
  }else{
   if(!texts(q.options)||q.options.length<2)return fail(`${ask}: pytanie wyboru wymaga co najmniej dwóch opcji.`);
   options=q.options as string[];
  }
  const refs=q.refs===undefined?[sentence??script[after].id]:q.refs;
  if(!Array.isArray(refs)||!refs.length||new Set(refs).size!==refs.length||!refs.every(ref=>at(ref)>=0&&at(ref)<=after))return fail(`${ask}: refs mogą wskazywać tylko zdania do after włącznie.`);
  const questionGlossary=q.glossary;
  if(!obj(questionGlossary)||!Object.keys(questionGlossary).length)return fail(`${ask}: pytanie wymaga glossary z tłumaczeniem co najmniej jednego słowa lub zwrotu z polecenia (D-70).`);
  if(!validQuestionGlossary(q.prompt as string,questionGlossary))return fail(`${ask}: glossary musi tłumaczyć widoczne słowa lub zwroty z pytania.`);
  const reading:ReadingQuestion={id:entry.id as string,question:index,type:q.type as 'choice'|'tap',after:script[after].id,...(sentence?{sentence}:{}),refs:refs as string[],glossary:{...questionGlossary}};
  return {id:`${entry.id}--${q.id}`,kind:'reading',responseType:'choice',prompt:q.prompt as string,answers,options,explanation:q.explanation as string,requires:entry.requires as string[],caseSensitive:false,source:entry.source as string,
   ...(q.ruleId!==undefined?{ruleId:q.ruleId as string}:{}),...(q.rev!==undefined?{rev:q.rev as number}:{}),reading};
 });
 if(new Set(exercises.map(q=>q.id)).size!==exercises.length)return fail(`${where}: powtórzony identyfikator pytania.`);
 return {reading:{id:entry.id,title:entry.title,...(illustration===undefined?{}:{illustration}),questionLanguage:entry.questionLanguage,sentences:script.map(s=>({id:s.id,text:s.text,translation:s.translation})),...(glossary?{glossary:{...glossary} as Record<string,string>}:{}),questionIds:exercises.map(q=>q.id)},exercises};
}
