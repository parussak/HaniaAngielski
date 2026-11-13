import {questionFor,optionsFor} from '../learning/questions.ts';
import type {Module,Session} from '../learning/model.ts';
import type {sceneView} from '../learning/scenes.ts';
import {e} from '../ui.ts';
import {vocabularyFullAnswer} from '../learning/vocabulary-answer.ts';
import {boardItems,gapTokens,solved,settled} from '../learning/boards.ts';
type ErrorFlash={key:string;answer:string;keys?:string[]}|undefined;
export function pairsView(modules:Module[],s:Session,error?:ErrorFlash){
 const group=boardItems(s).slice().sort((a,b)=>a.key<b.key?-1:1),selected=s.pairSelection??s.items[s.index].key;
 return `<section class="pair-board" aria-label="Dobierz w pary"><p>Połącz wszystkie pary. Wybierz hasło, potem tłumaczenie.</p><div class="pair-columns"><div>${group.map(i=>`<button class="pair-source ${selected===i.key?'is-selected':''} ${solved(s,i.key)?'pair-correct':''} ${error?.key===i.key?'match-flash':''}" data-action="pair-select" data-key="${e(i.key)}" aria-pressed="${selected===i.key}" ${settled(s,i.key)?'disabled':''}>${e(questionFor(modules,i).prompt)}${solved(s,i.key)?' ✓':''}</button>`).join('')}</div><div>${group.slice().reverse().map(i=>{const answer=vocabularyFullAnswer(questionFor(modules,i));return `<button class="option pair-target ${solved(s,i.key)?'pair-correct':''} ${error?.answer===answer?'match-flash':''}" data-action="pair-answer" data-answer="${e(answer)}" ${solved(s,i.key)?'disabled':''}>${e(answer)}</button>`;}).join('')}</div></div></section>`;
}
export function bankView(modules:Module[],s:Session,error?:ErrorFlash){
 const group=boardItems(s),tokens=s.items[s.index].gapGroup?gapTokens(modules,s).slice().reverse():optionsFor(questionFor(modules,s.items[s.index]),s),selected=s.gapSelection??s.draftAnswer;
 const sentence=(text:string,key:string)=>text.split('___').map(e).join(`<button class="gap-target ${error?.key===key||error?.keys?.includes(key)?'match-flash':''} ${solved(s,key)?'gap-correct':''}" data-action="gap-place" data-key="${e(key)}" aria-label="Luka w zdaniu: ${e(questionFor(modules,group.find(i=>i.key===key)!).prompt)}" ${solved(s,key)?'disabled':''}>${e(s.gapPlacements?.[key]??'…')}</button>`);
 return `<section class="answer-bank" aria-label="Uzupełnij luki"><p>Przeciągnij słowo do luki albo kliknij słowo, a potem lukę.</p><div class="gap-sentences">${group.map(i=>{const q=questionFor(modules,i);return `<article class="gap-sentence">${q.dialogue?q.dialogue.map(line=>`<p><strong>${e(line.speaker)}:</strong> ${sentence(line.text,i.key)}</p>`).join(''):`<p>${sentence(q.prompt,i.key)}</p>`}</article>`;}).join('')}</div><div class="bank-options">${tokens.map(token=>`<button class="option bank-token ${selected===token?'is-selected':''}" draggable="true" data-action="bank-select" data-answer="${e(token)}" aria-pressed="${selected===token}" ${group.some(i=>solved(s,i.key)&&s.gapPlacements?.[i.key]===token)?'disabled':''}>${e(token)}</button>`).join('')}</div><button class="primary" data-action="gap-check" ${group.every(i=>solved(s,i.key)||s.gapPlacements?.[i.key])?'':'disabled'}>Sprawdź zdania ✓</button></section>`;
}
type SceneOnScreen=NonNullable<ReturnType<typeof sceneView>>;
/** D-53: the conversation so far. Earlier lines stay, later lines wait for their gap. */
export function sceneScriptView(modules:Module[],{scene,items,position}:SceneOnScreen,whole=false){
 let gap=0;const lines:string[]=[];
 for(const [index,line] of scene.lines.entries()){
  const first=gap,parts=line.text.split('___');
  const text=parts.map(e).reduce((html,part)=>{const g=gap++;return html+(whole||g<position?`<b class="scene-filled">${e(questionFor(modules,items[g]).answers[0])}</b>`:`<span class="dialogue-gap ${g===position?'scene-current':''}" ${g===position?'aria-label="luka do uzupełnienia"':'aria-hidden="true"'}>…</span>`)+part;});
  const now=!whole&&parts.length>1&&first<=position&&position<gap;
  lines.push(`<div class="dialogue-line ${index%2?'dialogue-reply':''} ${now?'scene-now':''}"><span class="dialogue-speaker">${e(line.speaker)}</span><p>${text}</p></div>`);
  // Lines after the current gap wait for their turn.
  if(!whole&&gap>position)break;
 }
 return `<div class="scene" data-key="${e(items[position].key)}" data-position="${position+1}" role="group" aria-label="Rozmowa: ${e(scene.title)}">${lines.join('')}</div>`;
}
export function sceneSummaryView(modules:Module[],s:Session,view:SceneOnScreen){
 const first=view.items.filter(i=>s.attempts.find(a=>a.key===i.key)?.first).length;
 return `<div class="feedback correct board-summary scene-summary" role="status"><h2>Rozmowa ukończona!</h2><p>${first} / ${view.items.length} poprawnie za pierwszym razem. Przeczytaj całą rozmowę jeszcze raz.</p>${sceneScriptView(modules,view,true)}<ul>${view.items.map(i=>{const q=questionFor(modules,i);return `<li><strong>${e(q.answers[0])}</strong> — ${e(q.explanation)}</li>`;}).join('')}</ul></div><button class="primary" data-action="next">Dalej →</button>`;
}
export function boardSummaryView(modules:Module[],s:Session){
 const group=boardItems(s),first=group.filter(i=>s.attempts.find(a=>a.key===i.key)?.first).length;
 return `<div class="feedback correct board-summary" role="status"><h2>Plansza ukończona!</h2><p>${first} / ${group.length} poprawnie za pierwszym razem. Cała plansza za Tobą.</p><ul>${group.map(i=>{const q=questionFor(modules,i);return `<li><strong>${e(q.prompt)} → ${e(vocabularyFullAnswer(q))}</strong>${q.kind==='grammar'?`<details><summary>Dlaczego tak?</summary><p>${e(q.explanation)}</p></details>`:''}</li>`;}).join('')}</ul></div><button class="primary" data-action="next">Dalej →</button>`;
}
