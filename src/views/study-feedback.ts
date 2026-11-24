import { AppState } from '../app/state.ts';
import { catView } from './cat.ts';
import { responseCat } from '../cats.ts';
import type { Exercise, Illustration, Session } from '../learning/model.ts';
import { e } from '../ui.ts';
import { vocabularyAssessment,vocabularyFullAnswer } from '../learning/vocabulary-answer.ts';
export function illustrationView(picture: Illustration | undefined, showCaption: boolean) {
    if (!picture)
        return '';
    return `<figure class="answer-illustration ${picture.scene ? 'context-illustration' : ''} ${showCaption ? '' : 'question-illustration'}" ${showCaption ? '' : 'aria-hidden="true"'}>${picture.src ? `<img src="${e(new URL(picture.src, document.baseURI).href)}" alt="${showCaption ? e(picture.caption) : ''}" width="200" height="140">` : `<span role="img" aria-label="${showCaption ? e(picture.caption) : ''}">${e(picture.symbol)}</span>`}${showCaption ? `<figcaption>${e(picture.caption)}</figcaption>` : ''}</figure>`;
}
function answerComparison(q: Exercise, session: Session) {
    const attempt = session.attempts.find(a => a.key === session.items[session.index].key);
    const answer = attempt?.lastAnswer ?? (attempt?.corrections === 0 ? attempt.answer : undefined);
    return `<div class="answer-comparison"><div class="given-answer"><span>Twoja odpowiedź</span><p>${answer === undefined ? 'Ostatnia odpowiedź nie jest dostępna w tym starszym zapisie.' : e(answer)}</p></div><div class="expected-answer"><span>Poprawna odpowiedź</span><p>${e(vocabularyFullAnswer(q))}</p></div></div>`;
}
function explanationView(q: Exercise, state: Readonly<AppState>, moduleId: string) {
    if (q.kind !== 'grammar') return `<p>${e(q.explanation)}</p>`;
    const rule = state.modules.find(m => m.id === moduleId)?.grammar.find(r => r.id === q.ruleId);
    return `<section class="grammar-explanation"><h3>Dlaczego tak?</h3><p>${e(q.explanation)}</p>${rule ? `<details><summary>Przypomnij zasadę: ${e(rule.title)}</summary><p>${e(rule.explanation)}</p><ul>${rule.examples.map(example => `<li>${e(example)}</li>`).join('')}</ul></details>` : ''}</section>`;
}
/** Feedback after an answer: praise or a gentle correction, the explanation and optional listening. */
export function feedbackView(state: Readonly<AppState>, s: Session, item: Session['items'][number], q: Exercise, audio: string) {
    const ok = s.lastCorrect;
    const given=s.attempts.find(a=>a.key===item.key)?.lastAnswer;
    const article=given===undefined?null:vocabularyAssessment(q,given);
    const articleNote=article?.note?`<aside class="article-note"><strong>${ok?'Warto zapamiętać':'Rodzajnik w tym haśle'}</strong><p>Pełna forma: <b>${e(vocabularyFullAnswer(q))}</b>. ${e(article.note)}</p></aside>`:'';
    return `<div class="feedback ${ok ? 'correct' : 'incorrect'}" role="status"><div class="feedback-lead"><strong>${ok ? 'Tak jest! Dobra robota ✦' : 'Spokojnie, tak właśnie się uczymy.'}</strong>${state.catCatalog ? catView(state.catCatalog, responseCat(state.catCatalog, s)) : ''}</div>${!ok ? answerComparison(q, s) : ''}${articleNote}${explanationView(q,state,item.moduleId)}${illustrationView(q.illustration, true)}${audio}</div>`;
}
