import {questionFor,optionsFor} from '../learning/questions.ts';
import type {Module,Session} from '../learning/model.ts';
import {e} from '../ui.ts';
import {vocabularyFullAnswer} from '../learning/vocabulary-answer.ts';

export function pairsView(modules:Module[],s:Session){
 const group=s.items.filter(i=>i.pairGroup===s.items[s.index].pairGroup).sort((a,b)=>a.key<b.key?-1:1);
 const selected=s.pairSelection??s.items[s.index].key;
 const done=(key:string)=>s.attempts.some(a=>a.key===key);
 const correct=(key:string)=>s.attempts.some(a=>a.key===key&&(a.first||a.corrected));
 // Stable reverse order keeps both columns independent and survives reload.
 return `<section class="pair-board" aria-label="Dobierz w pary"><p>Wybierz polskie hasło, potem jego tłumaczenie. Każda para to jedno zadanie.</p><div class="pair-columns"><div>${group.map(i=>`<button class="pair-source ${selected===i.key?'is-selected':''} ${done(i.key)?correct(i.key)?'pair-correct':'pair-wrong':''}" data-action="pair-select" data-key="${e(i.key)}" aria-pressed="${selected===i.key}" ${done(i.key)&&s.items[s.index].key!==i.key?'disabled':''}>${e(questionFor(modules,i).prompt)}${done(i.key)&&s.items[s.index].key!==i.key?correct(i.key)?' ✓':' •':''}</button>`).join('')}</div><div>${group.slice().reverse().map(i=>`<button class="option pair-target" data-action="pair-answer" data-answer="${e(vocabularyFullAnswer(questionFor(modules,i)))}">${e(vocabularyFullAnswer(questionFor(modules,i)))}</button>`).join('')}</div></div></section>`;
}
export function bankView(modules:Module[],s:Session){
 const q=questionFor(modules,s.items[s.index]);
 return `<section class="answer-bank" aria-label="Bank odpowiedzi"><p>Wybierz brakujący fragment i sprawdź odpowiedź.</p><div class="bank-options">${optionsFor(q,s).map(option=>`<button class="option bank-token ${s.draftAnswer===option?'is-selected':''}" data-action="bank-select" data-answer="${e(option)}" aria-pressed="${s.draftAnswer===option}">${e(option)}</button>`).join('')}</div><p class="bank-gap" aria-live="polite">W luce: <strong>${s.draftAnswer===undefined?'…':e(s.draftAnswer)}</strong></p><button class="primary" data-action="answer" data-answer="${e(s.draftAnswer??'')}" ${s.draftAnswer===undefined?'disabled':''}>Sprawdź ✓</button></section>`;
}
