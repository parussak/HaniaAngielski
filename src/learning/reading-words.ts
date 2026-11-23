import {normalizeAnswer} from '../answers.ts';

/** D-68: words of a reading sentence, for tappable words and the glossary of a question. No course knowledge. */
export const readingWord=/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;
const word=readingWord;


/** Words of a sentence, each once, in reading order. */
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
