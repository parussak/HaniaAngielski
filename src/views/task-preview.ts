// D-81: ukończone zadanie tylko do czytania i odsłuchu — polecenie, udzielona odpowiedź, informacja zwrotna.
import type {AppState} from '../app/state.ts';
import type {Exercise,Item,Session} from '../learning/model.ts';
import {questionFor} from '../learning/questions.ts';
import {completedTasks} from '../learning/task-progress.ts';
import {readingContext} from '../learning/readings.ts';
import {listeningTask,vocabularyPlayback} from '../learning/listening.ts';
import {translationPrompt} from '../learning/scope.ts';
import {speaker} from '../speech.ts';
import {act,e} from '../ui.ts';
import {exercisePromptView} from './exercise-prompt.ts';
import {listenButtons} from './study-answer.ts';
import {feedbackView,givenAnswerView} from './study-feedback.ts';

const line=(speaker:string,html:string)=>`<div class="dialogue-line"><span class="dialogue-speaker">${e(speaker)}</span><p>${html}</p></div>`;
const gaps=(text:string,fill:()=>string)=>text.split('___').map(e).reduce((html,part)=>html+fill()+part);

/** Kwestia z luką i poprzednia. Odpowiedzi nieukończonych luk zostają zakryte, żeby podgląd nie podpowiadał. */
function sceneLines(state:Readonly<AppState>,s:Session,item:Item,q:Exercise){
 const scene=state.modules.find(m=>m.id===item.moduleId)?.scenes?.find(x=>x.id===q.scene!.id);
 if(!scene)return '';
 const done=completedTasks(s);
 const answer=(gap:number)=>{
  const position=s.items.findIndex(i=>i.moduleId===item.moduleId&&i.id===scene.gapIds[gap]);
  return done.has(position)?e(questionFor(state.modules,s.items[position]).answers[0]):'…';
 };
 let gap=0;
 const lines=scene.lines.map(({speaker,text})=>{
  const first=gap;
  const html=gaps(text,()=>{const current=gap++;return current===q.scene!.gap?'___':answer(current);});
  return {html:line(speaker,html),asked:q.scene!.gap>=first&&q.scene!.gap<gap};
 });
 const asked=lines.findIndex(x=>x.asked);
 return lines.slice(Math.max(0,asked-1),asked+1).map(x=>x.html).join('');
}

function promptView(state:Readonly<AppState>,s:Session,item:Item,q:Exercise){
 const module=state.modules.find(m=>m.id===item.moduleId)!;
 if(item.type==='word')return `<p class="exercise-instruction">${e(translationPrompt(module))}</p><h2 class="question">${e(q.prompt)}</h2>`;
 if(q.kind==='grammar')return exercisePromptView(q.prompt,false);
 const heading=`<h2 class="question">${e(q.prompt)}</h2>`;
 const reading=q.reading&&readingContext(state.modules,item);
 if(reading)return `<div class="reading reading-context">${reading.sentences.map(x=>`<p>${e(x.text)}</p>`).join('')}</div>${heading}`;
 const lines=item.sceneGroup&&q.scene?sceneLines(state,s,item,q):q.dialogue?.map(x=>line(x.speaker,gaps(x.text,()=>'___'))).join('');
 return heading+(lines?`<div class="dialogue">${lines}</div>`:'');
}

function audioView(state:Readonly<AppState>,s:Session,item:Item){
 const heard=listeningTask(state.modules,item);
 const task=heard??(['flashcards','flashcards-basic','quiz'].includes(s.mode)?vocabularyPlayback(state.modules,item):undefined);
 if(!task||!speaker().available(task.language,task.text))return '';
 return listenButtons(task,item.key,false,heard?undefined:'Posłuchaj odpowiedzi');
}

export function taskPreviewView(state:Readonly<AppState>,s:Session,position:number){
 const item=s.items[position],q=questionFor(state.modules,item);
 const attempt=s.attempts.find(a=>a.key===item.key)!,ok=attempt.first||attempt.corrected;
 const shown={...s,index:position,lastCorrect:ok};
 // Informacja zwrotna po błędzie sama porównuje odpowiedzi; po sukcesie pokazujemy udzieloną.
 const given=ok?givenAnswerView(attempt):'';
 return `<div class="task-preview"><p class="task-preview-label">PODGLĄD UKOŃCZONEGO ZADANIA</p>${promptView(state,s,item,q)}${given}${feedbackView(state,shown,item,q,audioView(state,s,item))}</div><div class="actions"><button class="primary" ${act('task-preview-close')}>Wróć do zadania ${s.index+1} →</button></div>`;
}
