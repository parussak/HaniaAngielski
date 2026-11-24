import type {AppState} from '../app/state.ts';
import {optionsFor} from '../learning/questions.ts';
import {type Exercise,type Item,type Module,type Session} from '../learning/model.ts';
import {readingContext,translateInReading,type readingView} from '../learning/readings.ts';
import {questionGlossaryParts,readingParts} from '../learning/reading-words.ts';
import {normalizeAnswer} from '../answers.ts';
import { act, e,icon } from '../ui.ts';

type ReadingOnScreen=NonNullable<ReturnType<typeof readingView>>;
interface ReadingParts {
 /** Normal and „Wolniej” buttons for one sentence, or '' when this device cannot speak. */
 say:(text:string)=>string;
 /** Feedback of the answered current question, shared with every other task. */
 feedback:(item:Item,q:Exercise)=>string;
 /** Whether the newest sentence may be read out once by itself (D-68). */
 autoplay:boolean;
}

/** One sentence in the text. While it is repeated as an answer, leave this copy as plain text. */
function sentenceView(view:ReadingOnScreen,s:Session,peek:AppState['readingPeek'],index:number,parts:ReadingParts){
 const sentence=view.reading.sentences[index],language=view.module.languageCode;
 const isTarget=sentence.id===view.tapSentence;
 const words=readingParts(sentence.text).map(part=>!part.word||isTarget?e(part.text)
  :`<button class="reading-word" ${act('reading-peek',{sentence:sentence.id,word:part.text})} aria-label="${e(`Przetłumacz: ${part.text}`)}">${e(part.text)}</button>`).join('');
 const shown=!isTarget&&peek?.sessionId===s.id&&peek.sentence===sentence.id?translateInReading(view.module,view.reading,sentence.id,peek.word):undefined;
 const translation=shown?`<p class="reading-translation" role="status">${shown.from==='sentence'?`<span>${peek!.word?`„${e(peek!.word)}” — tłumaczenie całego zdania:`:'Tłumaczenie zdania:'}</span> `:`<span>„${e(peek!.word)}” —</span> `}<b>${e(shown.text)}</b></p>`:'';
 const tools=`<div class="reading-tools">${parts.say(sentence.text)}${isTarget?'':`<button class="secondary reading-translate" ${act('reading-peek',{sentence:sentence.id})} aria-label="Pokaż tłumaczenie zdania">PL</button>`}</div>`;
 return `<div class="reading-sentence ${sentence.id===view.newest?'reading-new':''}" data-sentence="${e(sentence.id)}"><p ${language?`lang="${e(language)}"`:''}>${words}</p>${tools}${translation}</div>`;
}

function tapWords(sentence:string,options:string[]){
 const unused=new Set(options.map(option=>normalizeAnswer(option)));
 return readingParts(sentence).map(part=>part.word&&unused.delete(normalizeAnswer(part.text))
  ?`<button type="button" class="reading-word reading-answer" ${act('answer',{answer:part.text})}>${e(part.text)}</button>`
  :e(part.text)).join('');
}

export function readingQuestionPrompt(state:Readonly<AppState>,s:Session,item:Item,question:Exercise){
 const glossary=question.reading?.glossary,peek=state.readingQuestionPeek;
 const active=peek?.sessionId===s.id&&peek.key===item.key?peek.term:undefined;
 const text=questionGlossaryParts(question.prompt,glossary).map(part=>part.term
  ?`<button type="button" class="reading-word" ${act('reading-question-peek',{key:item.key,term:part.term})} aria-pressed="${part.term===active}">${e(part.text)}</button>`
  :e(part.text)).join('');
 const translation=active&&glossary&&Object.hasOwn(glossary,active)
  ?`<p class="reading-translation" role="status">„${e(active)}” — <b>${e(glossary[active])}</b></p>`:'';
 return {text,translation};
}

function questionView(state:Readonly<AppState>,view:ReadingOnScreen,s:Session,index:number,parts:ReadingParts){
 const {item,question,status}=view.questions[index],lang=`lang="${e(view.reading.questionLanguage)}"`;
 if(status==='hidden')return '';
 const {text,translation}=readingQuestionPrompt(state,s,item,question);
 const heading=`<h2 class="question" ${lang}>${text}</h2>${translation}`;
 const target=question.reading.type==='tap'?view.reading.sentences.find(sentence=>sentence.id===question.reading.sentence):undefined;
 const repeated=target?`<div class="reading-sentence reading-tap"><p ${lang}>${tapWords(target.text,status==='open'?question.options:[])}</p></div>`:'';
 if(status==='open'){
  const answer=target
   ?`<p class="reading-hint">Dotknij jednego z wyróżnionych słów.</p>${repeated}`
   :`<div class="answer-options" ${lang}>${optionsFor(question,s).map((o,i)=>`<button class="option" ${act('answer',{answer:o})}><span aria-hidden="true">${String.fromCharCode(65+i)}</span>${e(o)}</button>`).join('')}</div>`;
  return `<section class="reading-question reading-open" aria-label="Pytanie do czytanki">${heading}${s.phase==='retry'?'<p class="retry-note">Teraz spróbuj ponownie. Pierwszy wynik pozostanie zapisany osobno.</p>':''}${answer}</section>`;
 }
 if(index===view.position)return `<section class="reading-question reading-current">${heading}${repeated}${parts.feedback(item,question)}</section>`;
 const attempt=s.attempts.find(a=>a.key===item.key)!,ok=attempt.first||attempt.corrected;
 return `<div class="reading-question reading-done ${ok?'correct':'incorrect'}"><p><span ${lang}>${text}</span> <b>${ok?'✓':'✗'} ${e(attempt.lastAnswer??attempt.answer)}</b></p>${translation}${ok?'':`<button class="secondary" ${act('retry',{key:item.key})}>Popraw odpowiedź</button>`}</div>`;
}

/** D-68: the text so far, sentence by sentence, with its questions in place. */
export function readingCard(state:Readonly<AppState>,view:ReadingOnScreen,s:Session,parts:ReadingParts){
 const blocks:string[]=[];
 for(let index=0;index<view.visible;index++){
  blocks.push(sentenceView(view,s,state.readingPeek,index,parts));
  view.questions.forEach((q,question)=>{if(view.reading.sentences.findIndex(x=>x.id===q.question.reading.after)===index)blocks.push(questionView(state,view,s,question,parts));});
 }
 const newest=view.reading.sentences[view.visible-1],language=view.module.languageCode;
 const autoplay=parts.autoplay&&language?`<span class="reading-autoplay" hidden data-autoplay="true" data-task="${e(`${s.id}:reading:${view.reading.id}:${newest.id}`)}" data-say="${e(newest.text)}" data-lang="${e(language)}" data-speech-kind="dialogue"></span>`:'';
 const step=view.next===null
  ?`<p class="reading-wait" id="reading-wait">Najpierw odpowiedz na pytanie.</p><button class="primary" ${act('reading-next')} data-reading-next disabled aria-describedby="reading-wait">Dalej ${icon('arrow')}</button>`
  :view.next==='finish'
  ?`<p class="reading-end">To już koniec czytanki. Błędne odpowiedzi możesz jeszcze poprawić.</p><button class="primary" ${act('next')} data-reading-next>Zakończ czytankę ${icon('arrow')}</button>`
  :`<button class="primary" ${act('reading-next')} data-reading-next>Dalej ${icon('arrow')}</button>`;
 return `<div class="exercise-label">${icon('book')} CZYTANKA · ${e(view.reading.title.toLocaleUpperCase('pl'))}</div><p class="reading-help">Dotknij słowa albo PL, aby zobaczyć tłumaczenie.</p><div class="reading" role="group" aria-label="${e(`Czytanka: ${view.reading.title}`)}" data-visible="${view.visible}">${blocks.join('')}</div>${autoplay}<div class="actions reading-actions">${step}</div>`;
}

/** A reading question outside its reading: the sentences it is about; a tap question keeps its words to tap. */
export function readingContextView(modules:Module[],item:Item,s:Session){
 const context=readingContext(modules,item);
 if(!context)return '';
 const language=modules.find(m=>m.id===item.moduleId)?.languageCode,tapping=s.phase!=='feedback';
 return `<div class="reading reading-context" aria-label="${e(`Fragment czytanki: ${context.reading.title}`)}">${context.sentences.map(sentence=>`<div class="reading-sentence ${sentence.id===context.tapSentence?'reading-tap':''}"><p ${language?`lang="${e(language)}"`:''}>${tapping&&sentence.id===context.tapSentence?tapWords(sentence.text,context.question.options):e(sentence.text)}</p></div>`).join('')}</div>`;
}
