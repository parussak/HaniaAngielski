import { AppState } from '../app/state.ts';
import {pairsView,bankView,bankExplanationView,boardSummaryView,sceneScriptView,sceneSummaryView,boardNextButton} from './lesson-activities.ts';
import {sceneActor} from './scene-actors.ts';
import {sceneView} from '../learning/scenes.ts';
import {readingView} from '../learning/readings.ts';
import {readingCard,readingContextView,readingQuestionPrompt} from './reading.ts';
import {listeningTask,vocabularyPlayback} from '../learning/listening.ts';
import {speaker} from '../speech.ts';
import {speechButtons} from './speech-controls.ts';
import { inputFor, questionFor, sessionCompatible, answerHint } from '../learning/questions.ts';
import { translationPrompt } from '../learning/scope.ts';
import { stageForSession } from '../stage-review.ts';
import { act, button, e, icon } from '../ui.ts';
import { feedbackView, illustrationView } from './study-feedback.ts';
import { choiceOptionsView, listenButtons, listenOptionsView, textAnswerView } from './study-answer.ts';
import { studyPage } from './study-page.ts';
import { bankExercisePrompt, splitExercisePrompt } from './exercise-prompt.ts';

function exercisePrompt(text: string) {
    const parts = splitExercisePrompt(text);
    if (!parts) return `<h2 class="question">${e(text)}</h2>`;
    return `<div class="exercise-prompt"><p class="exercise-instruction">${e(parts.instruction)}</p><h2 class="question">${e(parts.sentence)}</h2></div>`;
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
    const scene = sceneView(state.modules, s);
    const actor=scene&&state.catCatalog?sceneActor(state.catCatalog,s,scene.scene):undefined;
    // D-58: a task marked for listening is spoken only when this device can speak the course language.
    const language=state.modules.find(m=>m.id===item.moduleId)?.languageCode;
    const heard=!scene&&!s.boardSummary?listeningTask(state.modules,item):undefined;
    const listen=heard&&speaker().available(heard.language,heard.text)?heard:undefined,asking=!!listen&&s.phase!=='feedback';
    const pronunciation=s.phase==='feedback'&&['flashcards','flashcards-basic','quiz'].includes(s.mode)?vocabularyPlayback(state.modules,item):undefined;
    const answerAudio=pronunciation&&speaker().available(pronunciation.language,pronunciation.text)?pronunciation:undefined;
    const say=(text:string)=>speaker().available(language,text)?`<span class="scene-audio">${speechButtons(text,language!,{kind:'dialogue',playLabel:'',playClass:'scene-say',slowClass:'scene-slow',playAria:'Posłuchaj tej kwestii',slowAria:'Posłuchaj tej kwestii wolniej'})}</span>`:'';
    const page=(card:string)=>studyPage(state,s,card);
    // D-68: a whole reading, sentence by sentence; the newest sentence is read out once when listening is on.
    const reading = readingView(state.modules, s, state.readingShown?.sessionId === s.id ? state.readingShown.count : undefined);
    if (reading) {
        const newest = reading.reading.sentences[reading.visible - 1].text;
        return page(readingCard(state, reading, s, {say, autoplay: speaker().available(language, newest), feedback: (current, question) => feedbackView(state, s, current, question, '') + (s.lastCorrect === false ? `<button class="secondary reading-retry" ${act('retry')}>Popraw odpowiedź</button>` : '')}));
    }
    let card = '';
    const formattedBank = (input === 'choice' || s.boardSummary) && bankExercisePrompt(q, item);
    const readingPrompt = q.reading ? readingQuestionPrompt(state,s,item,q) : undefined;
    const prompt = formattedBank ? '' : readingPrompt
        ? `<h2 class="question"${language ? ` lang="${e(language)}"` : ''}>${readingPrompt.text}</h2>${readingPrompt.translation}`
        : q.kind === 'grammar' ? exercisePrompt(q.prompt) : `<h2 class="question">${e(q.prompt)}</h2>`;
    if(asking)card=`<div class="exercise-label">${icon('sound')} POSŁUCHAJ</div><h2 class="question">${listen!.choices?'Posłuchaj i wybierz, co to znaczy.':'Posłuchaj i wpisz to, co słyszysz.'}</h2>${listenButtons(listen!,item.key,true)}`;
    else card = `<div class="exercise-label">${icon(item.type === 'word' ? 'cards' : q.kind === 'grammar' || q.kind === 'reading' ? 'book' : 'spark')} ${item.type === 'word' ? 'FISZKA · '+translationPrompt(state.modules.find(m=>m.id===item.moduleId)!).toLocaleUpperCase('pl') : q.kind === 'dialogue' ? 'POROZMAWIAJMY'+(scene?' · '+e(scene.scene.title.toLocaleUpperCase('pl')):'') : q.kind === 'reading' ? 'CZYTANKA' : q.kind === 'grammar' ? 'MAŁY KROK W GRAMATYCE' : 'SŁÓWKO PO SŁÓWKU'}</div>${prompt}`;
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
        card += s.phase === 'retry' ? '<p class="retry-note">Teraz spróbuj ponownie. Pierwszy wynik pozostanie zapisany osobno.</p>' : formattedBank || (scene && scene.position > 0) ? '' : '<p>Nie musisz wiedzieć wszystkiego. Po prostu spróbuj.</p>';
        card += item.pairGroup&&input==='choice'?pairsView(state.modules,s,state.boardError):item.presentation==='bank'&&input==='choice'?bankView(state.modules,s,state.boardError):asking&&listen!.choices ? listenOptionsView(q,s,listen!.choices) : input === 'choice' && q.reading?.type === 'tap' ? '<p class="reading-hint">Dotknij właściwego słowa w zdaniu.</p>' : input === 'choice' ? choiceOptionsView(q,s) : textAnswerView(hint,asking);
    }
    if(!s.boardSummary&&s.phase!=='feedback'&&(item.pairGroup||item.presentation==='bank'))card+=`${item.presentation==='bank'?bankExplanationView(state.modules,s):''}${boardNextButton(s)}`;
    return page(card);
}
