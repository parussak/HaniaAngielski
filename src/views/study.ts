import { AppState } from '../app/state.ts';
import {pairsView,bankView,bankExplanationView,boardSummaryView,sceneScriptView,sceneSummaryView,boardNextButton} from './lesson-activities.ts';
import {sceneActor} from './scene-actors.ts';
import {sceneView} from '../learning/scenes.ts';
import {readingView} from '../learning/readings.ts';
import {readingCard,readingContextView,readingQuestionPrompt} from './reading.ts';
import {listeningTask,vocabularyPlayback} from '../learning/listening.ts';
import {speaker} from '../speech.ts';
import {speechButtons} from './speech-controls.ts';
import { catView } from './cat.ts';
import { responseCat } from '../cats.ts';
import { inputFor, optionsFor, questionFor, sessionCompatible, type Exercise, type Illustration, type Session } from '../core.ts';
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
/** Feedback after an answer: praise or a gentle correction, the explanation and optional listening. */
function feedbackView(state: Readonly<AppState>, s: Session, item: Session['items'][number], q: Exercise, audio: string) {
    const ok = s.lastCorrect;
    const given=s.attempts.find(a=>a.key===item.key)?.lastAnswer;
    const article=given===undefined?null:vocabularyAssessment(q,given);
    const articleNote=article?.note?`<aside class="article-note"><strong>${ok?'Warto zapamiętać':'Rodzajnik w tym haśle'}</strong><p>Pełna forma: <b>${e(vocabularyFullAnswer(q))}</b>. ${e(article.note)}</p></aside>`:'';
    return `<div class="feedback ${ok ? 'correct' : 'incorrect'}" role="status"><div class="feedback-lead"><strong>${ok ? 'Tak jest! Dobra robota ✦' : 'Spokojnie, tak właśnie się uczymy.'}</strong>${state.catCatalog ? catView(state.catCatalog, responseCat(state.catCatalog, s)) : ''}</div>${!ok ? answerComparison(q, s) : ''}${articleNote}${explanationView(q,state,item.moduleId)}${q.source ? `<p class="source-reference">Źródło: ${e(q.source)}</p>` : ''}${illustrationView(q.illustration, true)}${audio}</div>`;
}
/** "Listen again" and "slower" are always there, as often as the learner likes. */
function listenButtons(task: {text:string;language:string}, key: string, autoplay: boolean,playLabel='Posłuchaj jeszcze raz') {
    return `<div class="listen" data-key="${e(key)}" ${autoplay?'data-autoplay="true"':''} data-say="${e(task.text)}" data-lang="${e(task.language)}">${speechButtons(task.text,task.language,{playLabel,playClass:'secondary listen-play',slowClass:'secondary listen-slow'})}</div>`;
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
    const scene = sceneView(state.modules, s);
    const actor=scene&&state.catCatalog?sceneActor(state.catCatalog,s,scene.scene):undefined;
    // D-58: a task marked for listening is spoken only when this device can speak the course language.
    const language=state.modules.find(m=>m.id===item.moduleId)?.languageCode;
    const heard=!scene&&!s.boardSummary?listeningTask(state.modules,item):undefined;
    const listen=heard&&speaker().available(heard.language,heard.text)?heard:undefined,asking=!!listen&&s.phase!=='feedback';
    const pronunciation=s.phase==='feedback'&&['flashcards','flashcards-basic','quiz'].includes(s.mode)?vocabularyPlayback(state.modules,item):undefined;
    const answerAudio=pronunciation&&speaker().available(pronunciation.language,pronunciation.text)?pronunciation:undefined;
    const say=(text:string)=>speaker().available(language,text)?`<span class="scene-audio">${speechButtons(text,language!,{kind:'dialogue',playLabel:'',playClass:'scene-say',slowClass:'scene-slow',playAria:'Posłuchaj tej kwestii',slowAria:'Posłuchaj tej kwestii wolniej'})}</span>`:'';
    const page=(card:string)=>`<button class="back" data-action="home">← Wróć do modułów · sesja zostaje zapisana</button><div class="study-heading"><div><div class="eyebrow">${s.scope?e(state.courses.find(c=>c.id===s.scope!.courseId)?.name??'POZNANY MATERIAŁ KURSU'):'TWÓJ MAŁY KROK'}</div><h1>${e(s.scope ? coursePracticeLabels[s.mode as CoursePracticeMode] : sessionTitle(s))}</h1></div><span class="tag">${s.index + 1} / ${s.items.length}</span></div><div class="progress-track" role="progressbar" aria-label="Pytanie ${s.index + 1} z ${s.items.length}" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><span style="width:${percent}%"></span></div><section class="study-card">${card}</section><p class="under-card">${icon('check')} ${state.storageError ? 'Zapis niedostępny — zapisz kopię przed zamknięciem.' : 'Każdy krok zapisuje się na tym urządzeniu.'}</p>`;
    // D-68: a whole reading, sentence by sentence; the newest sentence is read out once when listening is on.
    const reading = readingView(state.modules, s, state.readingShown?.sessionId === s.id ? state.readingShown.count : undefined);
    if (reading) {
        const newest = reading.reading.sentences[reading.visible - 1].text;
        return page(readingCard(state, reading, s, {say, autoplay: speaker().available(language, newest), feedback: (current, question) => feedbackView(state, s, current, question, '') + (s.lastCorrect === false ? '<button class="secondary reading-retry" data-action="retry">Popraw odpowiedź</button>' : '')}));
    }
    let card = '';
    const prompt = q.reading ? readingQuestionPrompt(state,s,item,q) : {text:e(q.prompt),translation:''};
    const promptLanguage = q.reading && language ? ` lang="${e(language)}"` : '';
    if(asking)card=`<div class="exercise-label">${icon('sound')} POSŁUCHAJ</div><h2 class="question">${listen!.choices?'Posłuchaj i wybierz, co to znaczy.':'Posłuchaj i wpisz to, co słyszysz.'}</h2>${listenButtons(listen!,item.key,true)}`;
    else card = `<div class="exercise-label">${icon(item.type === 'word' ? 'cards' : q.kind === 'grammar' || q.kind === 'reading' ? 'book' : 'spark')} ${item.type === 'word' ? 'FISZKA · '+translationPrompt(state.modules.find(m=>m.id===item.moduleId)!).toLocaleUpperCase('pl') : q.kind === 'dialogue' ? 'POROZMAWIAJMY'+(scene?' · '+e(scene.scene.title.toLocaleUpperCase('pl')):'') : q.kind === 'reading' ? 'CZYTANKA' : q.kind === 'grammar' ? 'MAŁY KROK W GRAMATYCE' : 'SŁÓWKO PO SŁÓWKU'}</div><h2 class="question"${promptLanguage}>${prompt.text}</h2>${prompt.translation}`;
    if (scene)
        card += sceneScriptView(state.modules, scene,false,actor,s,say);
    else if (q.reading)
        card += readingContextView(state.modules, item, s);
    else if (q.dialogue&&item.presentation!=='bank')
        card += `<div class="dialogue" aria-label="Dialog do uzupełnienia">${q.dialogue.map((line, i) => `<div class="dialogue-line ${i % 2 ? 'dialogue-reply' : ''}"><span class="dialogue-speaker">${e(line.speaker)}</span><p>${line.text.split('___').map(e).join('<span class="dialogue-gap" aria-label="luka">'+e(s.draftAnswer??'…')+'</span>')}</p></div>`).join('')}</div>`;
    if(s.boardSummary){card=scene?sceneSummaryView(state.modules,s,scene,actor,say):card+(item.presentation==='bank'?illustrationView(q.illustration,false):'')+boardSummaryView(state.modules,s);}
    else if (s.phase === 'feedback') {
        const ok = s.lastCorrect;
        card += `${feedbackView(state,s,item,q,listen?listenButtons(listen,item.key,false):answerAudio?listenButtons(answerAudio,item.key,false,'Posłuchaj odpowiedzi'):'')}<div class="actions">${!ok&&!scene ? button('retry', 'Spróbuję jeszcze raz', 'secondary') : ''}${button('next', `Dalej ${icon('arrow')}`)}</div>`;
    }
    else {
        // A scene shows its picture once, with the first line, and then leaves room for the conversation.
        if (!asking && (!scene || scene.position === 0)) card += illustrationView(q.illustration, false);
        card += s.phase === 'retry' ? '<p class="retry-note">Teraz spróbuj ponownie. Pierwszy wynik pozostanie zapisany osobno.</p>' : scene && scene.position > 0 ? '' : '<p>Nie musisz wiedzieć wszystkiego. Po prostu spróbuj.</p>';
        card += item.pairGroup&&input==='choice'?pairsView(state.modules,s,state.boardError):item.presentation==='bank'&&input==='choice'?bankView(state.modules,s,state.boardError):asking&&listen!.choices ? `<div class="answer-options listen-options">${optionsFor({...q,options:listen!.choices.map(c=>c.answer)}, s).map((o, i) => {const choice=listen!.choices!.find(c=>c.answer===o)!;return `<button class="option listen-option" data-action="answer" data-answer="${e(o)}"><span aria-hidden="true">${String.fromCharCode(65 + i)}</span>${choice.illustration?.symbol?`<span class="listen-picture" aria-hidden="true">${e(choice.illustration.symbol)}</span>`:choice.illustration?.src?`<img class="listen-picture" src="${e(new URL(choice.illustration.src, document.baseURI).href)}" alt="" width="48" height="34">`:''}${e(choice.label)}</button>`;}).join('')}</div>`:input === 'choice' && q.reading?.type === 'tap' ? '<p class="reading-hint">Dotknij właściwego słowa w zdaniu.</p>' : input === 'choice' ? `<div class="answer-options">${optionsFor(q, s).map((o, i) => `<button class="option" data-action="answer" data-answer="${e(o)}"><span aria-hidden="true">${String.fromCharCode(65 + i)}</span>${e(o)}</button>`).join('')}</div>` : `${hint&&!asking?`<p id="answer-hint">${e(hint)}</p>`:''}<form id="answer-form"><label for="answer" class="sr-only">Twoja odpowiedź</label><input id="answer" name="answer" class="answer-input" ${hint&&!asking?'aria-describedby="answer-hint"':''} placeholder="Wpisz odpowiedź…" autocomplete="off" autocorrect="off" enterkeyhint="done" autocapitalize="off" spellcheck="false" maxlength="500" required><button class="primary" type="submit">Sprawdź ${icon('check')}</button></form>`;
    }
    if(!s.boardSummary&&s.phase!=='feedback'&&(item.pairGroup||item.presentation==='bank'))card+=`${item.presentation==='bank'?bankExplanationView(state.modules,s):''}${boardNextButton(s)}`;
    return page(card);
}
