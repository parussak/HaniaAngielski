import type {AppState} from '../app/state.ts';
import {optionsFor,type Exercise,type Item,type Module,type Session} from '../core.ts';
import {readingContext,translateInReading,type readingView} from '../learning/readings.ts';
import {readingParts} from '../learning/reading-format.ts';
import {e,icon} from '../ui.ts';

type ReadingOnScreen=NonNullable<ReturnType<typeof readingView>>;
interface ReadingParts {
 /** Normal and „Wolniej” buttons for one sentence, or '' when this device cannot speak. */
 say:(text:string)=>string;
 /** Feedback of the answered current question, shared with every other task. */
 feedback:(item:Item,q:Exercise)=>string;
 /** Whether the newest sentence may be read out once by itself (D-68). */
 autoplay:boolean;
}

/** One sentence: tappable words for a translation, or answer buttons while it is the open tap question. */
function sentenceView(view:ReadingOnScreen,s:Session,peek:AppState['readingPeek'],index:number,parts:ReadingParts){
 const sentence=view.reading.sentences[index],language=view.module.languageCode;
 const open=view.questions[view.position],tapping=view.questionOpen&&open.question.reading.type==='tap'&&open.question.reading.sentence===sentence.id;
 // An open question keeps every translation closed, so a preview never gives the answer away.
 const peeking=!view.questionOpen;
 const words=readingParts(sentence.text).map(part=>!part.word?e(part.text)
  :tapping?`<button class="reading-word reading-answer" data-action="answer" data-answer="${e(part.text)}">${e(part.text)}</button>`
  :peeking?`<button class="reading-word" data-action="reading-peek" data-sentence="${e(sentence.id)}" data-word="${e(part.text)}" aria-label="${e(`Przetłumacz: ${part.text}`)}">${e(part.text)}</button>`
  :e(part.text)).join('');
 const shown=peeking&&peek?.sessionId===s.id&&peek.sentence===sentence.id?translateInReading(view.module,view.reading,sentence.id,peek.word):undefined;
 const translation=shown?`<p class="reading-translation" role="status">${shown.from==='sentence'?`<span>${peek!.word?`„${e(peek!.word)}” — tłumaczenie całego zdania:`:'Tłumaczenie zdania:'}</span> `:`<span>„${e(peek!.word)}” —</span> `}<b>${e(shown.text)}</b></p>`:'';
 const tools=`<div class="reading-tools">${parts.say(sentence.text)}${peeking?`<button class="secondary reading-translate" data-action="reading-peek" data-sentence="${e(sentence.id)}" aria-label="Pokaż tłumaczenie zdania">PL</button>`:''}</div>`;
 return `<div class="reading-sentence ${sentence.id===view.newest?'reading-new':''} ${tapping?'reading-tap':''}" data-sentence="${e(sentence.id)}"><p ${language?`lang="${e(language)}"`:''}>${words}</p>${tools}${translation}</div>`;
}

function questionView(view:ReadingOnScreen,s:Session,index:number,parts:ReadingParts){
 const {item,question,status}=view.questions[index],lang=`lang="${e(view.reading.questionLanguage)}"`;
 if(status==='hidden')return '';
 if(status==='open'){
  const answer=question.reading.type==='tap'
   ?`<p class="reading-hint">Dotknij słowa w zaznaczonym zdaniu.</p>`
   :`<div class="answer-options">${optionsFor(question,s).map((o,i)=>`<button class="option" data-action="answer" data-answer="${e(o)}"><span aria-hidden="true">${String.fromCharCode(65+i)}</span>${e(o)}</button>`).join('')}</div>`;
  return `<section class="reading-question reading-open" aria-label="Pytanie do czytanki"><h2 class="question" ${lang}>${e(question.prompt)}</h2>${s.phase==='retry'?'<p class="retry-note">Teraz spróbuj ponownie. Pierwszy wynik pozostanie zapisany osobno.</p>':''}${answer}</section>`;
 }
 if(index===view.position)return `<section class="reading-question reading-current"><h2 class="question" ${lang}>${e(question.prompt)}</h2>${parts.feedback(item,question)}</section>`;
 const attempt=s.attempts.find(a=>a.key===item.key)!,ok=attempt.first||attempt.corrected;
 return `<div class="reading-question reading-done ${ok?'correct':'incorrect'}"><p><span ${lang}>${e(question.prompt)}</span> <b>${ok?'✓':'✗'} ${e(attempt.lastAnswer??attempt.answer)}</b></p>${ok?'':`<button class="secondary" data-action="retry" data-key="${e(item.key)}">Popraw odpowiedź</button>`}</div>`;
}

/** D-68: the text so far, sentence by sentence, with its questions in place. */
export function readingCard(state:Readonly<AppState>,view:ReadingOnScreen,s:Session,parts:ReadingParts){
 const blocks:string[]=[];
 for(let index=0;index<view.visible;index++){
  blocks.push(sentenceView(view,s,state.readingPeek,index,parts));
  view.questions.forEach((q,question)=>{if(view.reading.sentences.findIndex(x=>x.id===q.question.reading.after)===index)blocks.push(questionView(view,s,question,parts));});
 }
 const newest=view.reading.sentences[view.visible-1],language=view.module.languageCode;
 const autoplay=parts.autoplay&&language?`<span class="reading-autoplay" hidden data-autoplay="true" data-task="${e(`${s.id}:reading:${view.reading.id}:${newest.id}`)}" data-say="${e(newest.text)}" data-lang="${e(language)}" data-speech-kind="dialogue"></span>`:'';
 const step=view.next===null
  ?`<p class="reading-wait" id="reading-wait">Najpierw odpowiedz na pytanie.</p><button class="primary" data-action="reading-next" data-reading-next disabled aria-describedby="reading-wait">Dalej ${icon('arrow')}</button>`
  :view.next==='finish'
  ?`<p class="reading-end">To już koniec czytanki. Błędne odpowiedzi możesz jeszcze poprawić.</p><button class="primary" data-action="next" data-reading-next>Zakończ czytankę ${icon('arrow')}</button>`
  :`<button class="primary" data-action="reading-next" data-reading-next>Dalej ${icon('arrow')}</button>`;
 return `<div class="exercise-label">${icon('book')} CZYTANKA · ${e(view.reading.title.toLocaleUpperCase('pl'))}</div><p class="reading-help">Dotknij słowa albo PL, aby zobaczyć tłumaczenie.</p><div class="reading" role="group" aria-label="${e(`Czytanka: ${view.reading.title}`)}" data-visible="${view.visible}">${blocks.join('')}</div>${autoplay}<div class="actions reading-actions">${step}</div>`;
}

/** A reading question outside its reading: the sentences it is about; a tap question keeps its words to tap. */
export function readingContextView(modules:Module[],item:Item,s:Session){
 const context=readingContext(modules,item);
 if(!context)return '';
 const language=modules.find(m=>m.id===item.moduleId)?.languageCode,tapping=s.phase!=='feedback';
 return `<div class="reading reading-context" aria-label="${e(`Fragment czytanki: ${context.reading.title}`)}">${context.sentences.map(sentence=>`<div class="reading-sentence ${sentence.id===context.tapSentence?'reading-tap':''}"><p ${language?`lang="${e(language)}"`:''}>${readingParts(sentence.text).map(part=>part.word&&tapping&&sentence.id===context.tapSentence?`<button class="reading-word reading-answer" data-action="answer" data-answer="${e(part.text)}">${e(part.text)}</button>`:e(part.text)).join('')}</p></div>`).join('')}</div>`;
}
