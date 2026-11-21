import {validateModules} from '../../src/content-validation.ts';
import {compileReading} from '../../src/learning/reading-format.ts';
import type {Journey} from '../../src/adventure.ts';
import {engineModule} from './engine.ts';

/** D-68: a synthetic reading in the authored format — four sentences, two choice questions and one tap question. */
export const readingEntry=(id='picnic',moduleId='reading-unit')=>({id,title:`Czytanka ${id}`,questionLanguage:'en',
 sentences:[
  {id:'s1',text:'Ala and Olek sit in the garden.',translation:'Ala i Olek siedzą w ogrodzie.'},
  {id:'s2',text:'Olek has got some apples.',translation:'Olek ma trochę jabłek.'},
  {id:'s3',text:'Ala reads a book.',translation:'Ala czyta książkę.'},
  {id:'s4',text:'The sun is warm.',translation:'Słońce jest ciepłe.'}],
 glossary:{garden:'ogród',Apples:'jabłka'},
 questions:[
  {id:'where',after:'s1',type:'choice',prompt:'Where are they sitting?',glossary:{where:'gdzie','are they sitting':'oni siedzą'},answers:['In the garden'],options:['In the garden','In the kitchen','At school'],refs:['s1'],explanation:'Zdanie mówi: in the garden.'},
  {id:'fruit',after:'s2',type:'tap',prompt:'Tap the name of the fruit.',glossary:{tap:'dotknij','name of the fruit':'nazwę owocu'},sentence:'s2',answers:['apples'],explanation:'Apples to jabłka.'},
  {id:'book',after:'s3',type:'choice',prompt:'What does Ala read?',glossary:{what:'co',read:'czyta'},answers:['A book'],options:['A book','A newspaper'],refs:['s3'],explanation:'A book to książka.'}],
 requires:[moduleId],source:'Dane syntetyczne — tekst testowy.'});

export const readingQuestionIds=(id='picnic')=>[`${id}--where`,`${id}--fruit`,`${id}--book`];

/** The engine module with readings; word-0 is "book" so a word can translate from the vocabulary. Any course id works. */
export function readingModule(id='reading-unit',courseId='reading-course',entries:unknown[]=[readingEntry('picnic',id)]){
 const base=engineModule(id,courseId),compiled=entries.map(entry=>compileReading(entry));
 const words=base.words.map((w,i)=>i===0?{...w,front:'książka',back:'book',answers:['book','a book']}:w);
 return validateModules([{...base,words,exercises:[...base.exercises,...compiled.flatMap(c=>c.exercises)],readings:compiled.map(c=>c.reading)}])[0];
}

/** One stage: a word lesson and a lesson that is the whole reading (D-54, D-68). */
export const readingJourney=(moduleId='reading-unit',readingId='picnic'):Journey=>({version:1,moduleId,title:'Mapa czytanek',stages:[{id:'one',title:'Etap',cat:'albert',illustration:'illustrations/test.svg',lessons:[
 {id:'words',title:'Słowa',intro:'',wordIds:['word-0','word-1','word-2','word-3','word-4','word-5'],exerciseIds:[],ruleIds:[]},
 {id:'reading',title:'Czytanka',intro:'',wordIds:[],exerciseIds:readingQuestionIds(readingId),ruleIds:[]},
]}]});
