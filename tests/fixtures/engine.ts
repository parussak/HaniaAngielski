import {validateModules} from '../../src/content-validation.ts';
import type {Module} from '../../src/core.ts';
/** Enough varied data to test session limits without relying on a textbook. */
export function engineModule(id='engine-unit',courseId='engine-course',order=2):Module{
 const words=Array.from({length:12},(_,i)=>({id:`word-${i}`,front:`Hasło ${i}`,back:`answer ${i}`,source:'Dane syntetyczne'}));
 const exercises=words.map(w=>({id:`quiz-${w.id}`,wordId:w.id,kind:'vocabulary' as const,prompt:`Podaj: ${w.front}`,answers:[w.back],options:[w.back,...words.filter(v=>v!==w).slice(0,2).map(v=>v.back)],explanation:'Wyjaśnienie testowe.',requires:[id],caseSensitive:false,source:'Dane syntetyczne'}));
 const grammar=Array.from({length:12},(_,i)=>({id:`grammar-${i}`,kind:'grammar' as const,prompt:`Uzupełnij ${i}: ___`,answers:[`form ${i}`],options:[`form ${i}`,'other'],explanation:'Reguła testowa.',requires:[id],caseSensitive:false,source:'Dane syntetyczne'}));
 return validateModules([{id,courseId,version:1,order,name:'Moduł testowy',subtitle:'Dane syntetyczne',language:'Angielski',source:'Dane syntetyczne',label:'TEST',cover:'Test',topics:['Test'],words,exercises:[...exercises,...grammar],grammar:[],basicFlashcardIds:words.slice(0,8).map(w=>w.id)}])[0];
}
export const engine=engineModule();
export const engineModules=[engine];
