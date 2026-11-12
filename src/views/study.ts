import { AppState } from '../app/state.ts';
import {pairsView,bankView,boardSummaryView} from './lesson-activities.ts';
import {lessonSummaryActions} from './lesson-summary-actions.ts';
import { catView } from './cat.ts';
import { endingCat, responseCat } from '../cats.ts';
import { inputFor, optionsFor, questionFor, score, sessionCompatible, type Exercise, type Illustration, type Session } from '../core.ts';
import { labels,sessionTitle } from '../learning-labels.ts';
import { translationPrompt } from '../learning/scope.ts';
import { coursePracticeLabels, type CoursePracticeMode } from '../learning/course-practice.ts';
import { stageForSession } from '../stage-review.ts';
import { button, e, icon } from '../ui.ts';
import { answerHint } from '../learning/questions.ts';
import { vocabularyAssessment,vocabularyFullAnswer } from '../learning/vocabulary-answer.ts';
function illustrationView(picture: Illustration | undefined, showCaption: boolean) {
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
export function studyView(state: Readonly<AppState>) {
    const s = state.progress.active;
    if (!s)
        return `<h1>Sesja zakończona</h1>${button('home', 'Wróć do modułów')}`;
    if((s.lesson||s.stageReview)&&state.journeyIssues.some(issue=>issue.moduleId===s.moduleId)&&!stageForSession(state.journeys,s))
        return `<h1>Wczytaj mapę tej lekcji</h1><p>Ta mapa jest chwilowo niedostępna. Twoja rozpoczęta sesja i odpowiedzi pozostają zapisane. Ponów wczytanie map lub wybierz inną przygodę.</p>${button('retry-maps','Spróbuj wczytać mapy ponownie')}${button('journeys','Wybierz inną mapę','secondary')}`;
    if (!sessionCompatible(state.modules, s))
        return `<h1>Potrzebny jest moduł</h1><p>Ta sesja pochodzi z innej wersji materiału lub brakującego modułu. Jej zapis i Twoja historia są bezpieczne. Możesz zapisać kopię albo rozpocząć nową sesję z dostępnego modułu.</p>${button('backup', 'Kopia postępów')}${button('home', 'Moja nauka', 'secondary')}`;
    const current=s.items[s.index];
    const item = s.phase!=='feedback'&&current.pairGroup&&s.pairSelection
        ? s.items.find(i=>i.key===s.pairSelection&&i.pairGroup===current.pairGroup)??current
        : current;
    const q = questionFor(state.modules, item);
    const input=inputFor(q,item.input,s.mode),hint=answerHint(q,input);
    const percent = Math.round(s.index / s.items.length * 100);
    let card = '';
    card = `<div class="exercise-label">${icon(item.type === 'word' ? 'cards' : q.kind === 'grammar' ? 'book' : 'spark')} ${item.type === 'word' ? 'FISZKA · '+translationPrompt(state.modules.find(m=>m.id===item.moduleId)!).toLocaleUpperCase('pl') : q.kind === 'dialogue' ? 'POROZMAWIAJMY' : q.kind === 'grammar' ? 'MAŁY KROK W GRAMATYCE' : 'SŁÓWKO PO SŁÓWKU'}</div><h2 class="question">${e(q.prompt)}</h2>`;
    if (q.dialogue&&item.presentation!=='bank')
        card += `<div class="dialogue" aria-label="Dialog do uzupełnienia">${q.dialogue.map((line, i) => `<div class="dialogue-line ${i % 2 ? 'dialogue-reply' : ''}"><span class="dialogue-speaker">${e(line.speaker)}</span><p>${line.text.split('___').map(e).join('<span class="dialogue-gap" aria-label="luka">'+e(s.draftAnswer??'…')+'</span>')}</p></div>`).join('')}</div>`;
    if(s.boardSummary){card=boardSummaryView(state.modules,s);}
    else if (s.phase === 'feedback') {
        const ok = s.lastCorrect;
        const given=s.attempts.find(a=>a.key===item.key)?.lastAnswer;
        const article=given===undefined?null:vocabularyAssessment(q,given);
        const articleNote=article?.note?`<aside class="article-note"><strong>${ok?'Warto zapamiętać':'Rodzajnik w tym haśle'}</strong><p>Pełna forma: <b>${e(vocabularyFullAnswer(q))}</b>. ${e(article.note)}</p></aside>`:'';
        card += `<div class="feedback ${ok ? 'correct' : 'incorrect'}" role="status"><div class="feedback-lead"><strong>${ok ? 'Tak jest! Dobra robota ✦' : 'Spokojnie, tak właśnie się uczymy.'}</strong>${state.catCatalog ? catView(state.catCatalog, responseCat(state.catCatalog, s)) : ''}</div>${!ok ? answerComparison(q, s) : ''}${articleNote}${explanationView(q,state,item.moduleId)}${q.source ? `<p class="source-reference">Źródło: ${e(q.source)}</p>` : ''}${illustrationView(q.illustration, true)}</div><div class="actions">${!ok ? button('retry', 'Spróbuję jeszcze raz', 'secondary') : ''}${button('next', `Dalej ${icon('arrow')}`)}</div>`;
    }
    else {
        card += illustrationView(q.illustration, false);
        card += s.phase === 'retry' ? '<p class="retry-note">Teraz spróbuj ponownie. Pierwszy wynik pozostanie zapisany osobno.</p>' : '<p>Nie musisz wiedzieć wszystkiego. Po prostu spróbuj.</p>';
        card += item.pairGroup&&input==='choice'?pairsView(state.modules,s,state.boardError):item.presentation==='bank'&&input==='choice'?bankView(state.modules,s,state.boardError):input === 'choice' ? `<div class="answer-options">${optionsFor(q, s).map((o, i) => `<button class="option" data-action="answer" data-answer="${e(o)}"><span aria-hidden="true">${String.fromCharCode(65 + i)}</span>${e(o)}</button>`).join('')}</div>` : `${hint?`<p id="answer-hint">${e(hint)}</p>`:''}<form id="answer-form"><label for="answer" class="sr-only">Twoja odpowiedź</label><input id="answer" name="answer" class="answer-input" ${hint?'aria-describedby="answer-hint"':''} placeholder="Wpisz odpowiedź…" autocomplete="off" autocorrect="off" enterkeyhint="done" autocapitalize="off" spellcheck="false" maxlength="500" required><button class="primary" type="submit">Sprawdź ${icon('check')}</button></form>`;
    }
    return `<button class="back" data-action="home">← Wróć do modułów · sesja zostaje zapisana</button><div class="study-heading"><div><div class="eyebrow">${s.scope?e(state.courses.find(c=>c.id===s.scope!.courseId)?.name??'POZNANY MATERIAŁ KURSU'):'TWÓJ MAŁY KROK'}</div><h1>${e(s.scope ? coursePracticeLabels[s.mode as CoursePracticeMode] : sessionTitle(s))}</h1></div><span class="tag">${s.index + 1} / ${s.items.length}</span></div><div class="progress-track" role="progressbar" aria-label="Pytanie ${s.index + 1} z ${s.items.length}" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><span style="width:${percent}%"></span></div><section class="study-card">${card}</section><p class="under-card">${icon('check')} ${state.storageError ? 'Zapis niedostępny — zapisz kopię przed zamknięciem.' : 'Każdy krok zapisuje się na tym urządzeniu.'}</p>`;
}
export function summaryView(state: Readonly<AppState>, home: () => string) {
    const s = state.lastSession ?? state.progress.sessions.at(-1);
    if (!s)
        return home();
    const result = score(s);
    const warmup=!!s.training||!!s.stageReview||!!s.recall||s.mode==='review';
    return `<section class="summary panel"><div class="celebration">${state.catCatalog ? catView(state.catCatalog, endingCat(state.catCatalog, s), true) : icon('cat')}</div><div class="eyebrow">KOLEJNY MAŁY KROK ZA TOBĄ</div><h1>${s.legendary?'Poziom legendarny ukończony!':warmup?`${sessionTitle(s)} ukończon${s.training?.kind==='map'?'y':'a'}!`:state.user ? state.user.displayName ? `Dobra robota, ${e(state.user.displayName)}!` : 'Dobra robota!' : 'Dobra robota, Haniu!'}</h1><p>${warmup?'Ten krótki zestaw masz za sobą. Możesz odpocząć albo dobrowolnie zrobić następny.':'Każda próba pomaga. Dziś wiesz już trochę więcej.'}</p>${s.lesson || s.stageReview || s.training ? `<div class="lesson-reward">${state.lastReward ? `+${state.lastReward} ★` : s.stageReview ? 'Rozgrzewka ukończona ✓' : s.training ? 'Rozgrzewka ukończona ✓' : 'Lekcja utrwalona ✓'}<small>${state.lastReward ? `Gwiazdki są już w Twoim portfelu.${state.lastStageReward ? ` W tym ${state.lastStageReward} ★ za ukończony etap i utrwalone błędy.` : ''}` : s.stageReview ? 'Ta sesja jest ukończona. Dalsze ćwiczenia są dobrowolne.' : 'Postęp tej sesji jest zachowany.'}</small></div>` : ''}${!s.attempts.length ? `<div class="summary-score">${new Set(s.items.map(i => i.key)).size}<span>przećwiczonych fiszek</span></div>` : `<div class="summary-score">${result.correct}<small> / ${result.total}</small><span>poprawnie za pierwszym razem</span></div><p>Poprawione za drugim razem: <b>${result.corrections}</b>. Ten wynik liczymy osobno.</p>`}${warmup&&!s.lesson?button('warmup','Wybierz kolejną rozgrzewkę','secondary'):''}${s.lesson?lessonSummaryActions(state,s):`<div class="actions journey-summary-actions">${s.stageReview ? `${button('map', 'Wróć na mapę')}${button('house', 'Urządź domek', 'secondary')}` : `${s.scope?button('course-practice','Wróć do poznanego materiału'):button('home', 'Wróć do modułów')}${button('progress', 'Zobacz postępy', 'secondary')}`}</div>`}</section>`;
}
