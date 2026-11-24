import { optionsFor } from '../learning/questions.ts';
import { type Exercise, type Session } from '../learning/model.ts';
import type { listeningTask } from '../learning/listening.ts';
import { speechButtons } from './speech-controls.ts';
import { act, e, icon } from '../ui.ts';
type ListeningChoices = NonNullable<NonNullable<ReturnType<typeof listeningTask>>['choices']>;
/** "Listen again" and "slower" are always there, as often as the learner likes. */
export function listenButtons(task: {text:string;language:string}, key: string, autoplay: boolean,playLabel='Posłuchaj jeszcze raz') {
    return `<div class="listen" data-key="${e(key)}" ${autoplay?'data-autoplay="true"':''} data-say="${e(task.text)}" data-lang="${e(task.language)}">${speechButtons(task.text,task.language,{playLabel,playClass:'secondary listen-play',slowClass:'secondary listen-slow'})}</div>`;
}
/** Choices of a listening task: each option is shown as the word (and picture) it stands for. */
export function listenOptionsView(q: Exercise, s: Session, choices: ListeningChoices) {
    return `<div class="answer-options listen-options">${optionsFor({...q,options:choices.map(c=>c.answer)}, s).map((o, i) => {const choice=choices.find(c=>c.answer===o)!;return `<button class="option listen-option" ${act('answer',{answer:o})}><span aria-hidden="true">${String.fromCharCode(65 + i)}</span>${choice.illustration?.symbol?`<span class="listen-picture" aria-hidden="true">${e(choice.illustration.symbol)}</span>`:choice.illustration?.src?`<img class="listen-picture" src="${e(new URL(choice.illustration.src, document.baseURI).href)}" alt="" width="48" height="34">`:''}${e(choice.label)}</button>`;}).join('')}</div>`;
}
export function choiceOptionsView(q: Exercise, s: Session) {
    return `<div class="answer-options">${optionsFor(q, s).map((o, i) => `<button class="option" ${act('answer',{answer:o})}><span aria-hidden="true">${String.fromCharCode(65 + i)}</span>${e(o)}</button>`).join('')}</div>`;
}
/** The typed answer: optional hint, input and the check button. */
export function textAnswerView(hint: string | null | undefined, asking: boolean) {
    return `${hint&&!asking?`<p id="answer-hint">${e(hint)}</p>`:''}<form id="answer-form"><label for="answer" class="sr-only">Twoja odpowiedź</label><input id="answer" name="answer" class="answer-input" ${hint&&!asking?'aria-describedby="answer-hint"':''} placeholder="Wpisz odpowiedź…" autocomplete="off" autocorrect="off" enterkeyhint="done" autocapitalize="off" spellcheck="false" maxlength="500" required><button class="primary" type="submit">Sprawdź ${icon('check')}</button></form>`;
}
