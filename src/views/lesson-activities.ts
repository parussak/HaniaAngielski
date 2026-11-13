import {questionFor,optionsFor} from '../learning/questions.ts';
import type {Module,Session} from '../learning/model.ts';
import type {sceneView} from '../learning/scenes.ts';
import {e} from '../ui.ts';
import {vocabularyFullAnswer} from '../learning/vocabulary-answer.ts';
import {boardItems,gapTokens,solved,settled,boardError,boardReady,gapPlacement} from '../learning/boards.ts';
import type {SceneActor} from './scene-actors.ts';
type ErrorFlash={key:string;answer:string;keys?:string[]}|undefined;
const retryButton=(key:string,label:string)=>`<button class="secondary board-retry" data-action="retry" data-key="${e(key)}">${e(label)}</button>`;
export function boardNextButton(s:Session){const ready=boardReady(s);return `${ready?'':'<p class="board-required">Uzupełnij wszystkie pola, aby przejść dalej.</p>'}<button class="primary" data-action="next" ${ready?'':'disabled'}>Dalej →</button>`;}
export function pairsView(modules:Module[],s:Session,error?:ErrorFlash){
 const group=boardItems(s).slice().sort((a,b)=>a.key<b.key?-1:1),selected=s.pairSelection??s.items[s.index].key;
 return `<section class="pair-board" aria-label="Dobierz w pary"><p>Połącz wszystkie pary. Wybierz hasło, potem tłumaczenie.</p><div class="pair-columns"><div>${group.map(i=>`<button class="pair-source ${selected===i.key?'is-selected':''} ${solved(s,i.key)?'pair-correct':''} ${error?.key===i.key?'match-flash':''}" data-action="pair-select" data-key="${e(i.key)}" aria-pressed="${selected===i.key}" ${settled(s,i.key)?'disabled':''}>${e(questionFor(modules,i).prompt)}${solved(s,i.key)?' ✓':''}</button>`).join('')}</div><div>${group.slice().reverse().map(i=>{const answer=vocabularyFullAnswer(questionFor(modules,i));return `<button class="option pair-target ${solved(s,i.key)?'pair-correct':''} ${error?.answer===answer?'match-flash':''}" data-action="pair-answer" data-answer="${e(answer)}" ${solved(s,i.key)?'disabled':''}>${e(answer)}</button>`;}).join('')}</div></div>${group.filter(i=>boardError(s,i.key)).map(i=>retryButton(i.key,'Spróbuj jeszcze raz: '+questionFor(modules,i).prompt)).join('')}</section>`;
}
export function bankView(modules:Module[],s:Session,error?:ErrorFlash){
 const group=boardItems(s).slice().sort((a,b)=>a.key.localeCompare(b.key)),tokens=s.items[s.index].gapGroup?gapTokens(modules,s).slice().reverse():optionsFor(questionFor(modules,s.items[s.index]),s),selected=s.gapSelection??s.draftAnswer;
 const sentence=(text:string,key:string)=>{const placed=gapPlacement(s,key);return text.split('___').map(e).join(`<button class="gap-target ${boardError(s,key)?'gap-incorrect':''} ${placed&&selected===placed?'is-selected':''} ${error?.key===key||error?.keys?.includes(key)?'match-flash':''} ${solved(s,key)?'gap-correct':''}" data-action="gap-place" data-key="${e(key)}" ${placed?`data-token="${e(placed)}" draggable="true"`:''} aria-label="Luka w zdaniu: ${e(questionFor(modules,group.find(i=>i.key===key)!).prompt)}" ${solved(s,key)?'disabled':''}>${e(placed??'…')}</button>`);};
 return `<section class="answer-bank" aria-label="Uzupełnij luki"><p>Wstaw słowo — sprawdzę od razu. Aby je przenieść, kliknij je w luce, a potem inną lukę lub puste miejsce w banku. Możesz też przeciągać.</p><div class="gap-sentences">${group.map(i=>{const q=questionFor(modules,i);return `<article class="gap-sentence">${q.dialogue?q.dialogue.map(line=>`<p><strong>${e(line.speaker)}:</strong> ${sentence(line.text,i.key)}</p>`).join(''):`<p>${sentence(q.prompt,i.key)}</p>`}${boardError(s,i.key)?retryButton(i.key,'Popraw lukę'):''}</article>`;}).join('')}</div><div class="bank-options" aria-label="Bank słów">${tokens.map(token=>{const used=group.find(i=>s.gapPlacements?.[i.key]===token);return `<button class="option bank-token ${used?'bank-empty':''} ${!used&&selected===token?'is-selected':''}" draggable="${!used}" data-action="${used?'gap-place':'bank-select'}" ${used?'data-key=""':''} data-answer="${e(token)}" aria-label="${e(used?`Odłóż ${token} do banku`:token)}" aria-pressed="${!used&&selected===token}" ${used&&solved(s,used.key)?'disabled':''}><span ${used?'aria-hidden="true"':''}>${e(token)}</span></button>`;}).join('')}</div></section>`;
}
type SceneOnScreen=NonNullable<ReturnType<typeof sceneView>>;
/** D-53: the conversation so far. Earlier lines stay, later lines wait for their gap. */
export function sceneScriptView(modules:Module[],{scene,items,position}:SceneOnScreen,whole=false,actor?:SceneActor,session?:Session,say?:(text:string)=>string){
 let gap=0;const lines:string[]=[],speakers=[...new Set(scene.lines.map(line=>line.speaker))];
 for(const [index,line] of scene.lines.entries()){
  const first=gap,parts=line.text.split('___');
  const text=parts.map(e).reduce((html,part)=>{const g=gap++;return html+(whole||g<position?`<b class="scene-filled">${e(questionFor(modules,items[g]).answers[0])}</b>`:`<span class="dialogue-gap ${g===position?'scene-current':''}" ${g===position?'aria-label="luka do uzupełnienia"':'aria-hidden="true"'}>…</span>`)+part;});
  const now=!whole&&parts.length>1&&first<=position&&position<gap;
  // D-58: a line can be heard once none of its gaps is open; an open gap would give the answer away.
  let spoken=first;const complete=whole||gap<=position,heard=complete&&say?say(line.text.replace(/___/g,()=>questionFor(modules,items[spoken++]).answers[0])):'';
  const retry=whole&&session?items.slice(first,gap).filter(i=>boardError(session,i.key)).map(i=>retryButton(i.key,'Popraw tę linijkę')).join(''):now&&session?.phase==='feedback'&&session.lastCorrect===false?'<button class="secondary scene-line-retry" data-action="retry">Popraw tę linijkę</button>':'';
  lines.push(`<div class="scene-message ${speakers.indexOf(line.speaker)%2?'scene-message-reply':''}" data-speaker="${e(line.speaker)}">${actor?`<div class="scene-line-avatar">${actor(line.speaker,index,whole)}</div>`:''}<div class="dialogue-line ${speakers.indexOf(line.speaker)%2?'dialogue-reply':''} ${now?'scene-now':''}"><span class="dialogue-speaker">${e(line.speaker)}</span><p>${text}</p>${heard}${retry}</div></div>`);
  // Lines after the current gap wait for their turn.
  if(!whole&&gap>position)break;
 }
 return `<div class="scene" data-key="${e(items[position].key)}" data-position="${position+1}" role="group" aria-label="Rozmowa: ${e(scene.title)}">${lines.join('')}</div>`;
}
export function sceneSummaryView(modules:Module[],s:Session,view:SceneOnScreen,actor?:SceneActor,say?:(text:string)=>string){
 return `<div class="feedback ${view.items.some(i=>boardError(s,i.key))?'incorrect':'correct'} board-summary scene-summary" role="status"><h2>Rozmowa ukończona!</h2><p>Dobra robota! Przeczytaj rozmowę i wyjaśnienia. Błędne linijki możesz poprawić albo przejść dalej.</p>${sceneScriptView(modules,view,true,actor,s,say)}<ul>${view.items.map(i=>{const q=questionFor(modules,i);return `<li><strong>${e(q.answers[0])}</strong> — ${e(q.explanation)}</li>`;}).join('')}</ul></div><button class="primary" data-action="next">Dalej →</button>`;
}
export function bankExplanationView(modules:Module[],s:Session){
 const group=boardItems(s).slice().sort((a,b)=>a.key.localeCompare(b.key));
 if(!s.boardSummary&&!group.every(i=>s.gapPlacements?.[i.key]))return '';
 const complete=group.every(i=>solved(s,i.key));
 return `<div class="feedback ${complete?'correct':'incorrect'} board-explanation" role="status"><h2>${complete?'Tak jest! Dobra robota ✦':'Sprawdźmy zdania'}</h2><p>${complete?'Plansza ukończona.':'Możesz poprawić luki albo przejść dalej — błędy poćwiczymy w powtórkach.'}</p>${group.map((i,index)=>{const q=questionFor(modules,i);return `<section class="gap-explanation"><strong>Zdanie ${index+1}: <span class="scene-filled">${e(vocabularyFullAnswer(q))}</span></strong><p>${e(q.explanation)}</p>${q.source?`<small>${e(q.source)}</small>`:''}</section>`;}).join('')}</div>`;
}
export function boardSummaryView(modules:Module[],s:Session){
 if(s.items[s.index].presentation==='bank')return `<div class="board-summary">${bankView(modules,s)}${bankExplanationView(modules,s)}</div>${boardNextButton(s)}`;
 const group=boardItems(s);
 return `<div class="feedback correct board-summary" role="status"><h2>Plansza ukończona!</h2><p>Dobra robota! Wszystkie pary są połączone.</p><ul>${group.map(i=>{const q=questionFor(modules,i);return `<li><strong>${e(q.prompt)} → ${e(vocabularyFullAnswer(q))}</strong><p>${e(q.explanation)}</p></li>`;}).join('')}</ul></div><button class="primary" data-action="next">Dalej →</button>`;
}
