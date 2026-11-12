import type {AppState} from '../app/state.ts';
import {courseModules,courseJourneys} from '../app/selectors.ts';
import {practicedItems} from '../learning/training.ts';
import {reviewStats} from '../stage-review.ts';
import {journeyKey} from '../adventure.ts';
import {keyFor} from '../core.ts';
import {button,e} from '../ui.ts';
export function warmupView(state:Readonly<AppState>){
 const modules=courseModules(state),anchor=modules[0],known=anchor?practicedItems(state.modules,anchor,state.progress):[];
 const topics=courseJourneys(state).flatMap(j=>j.stages.filter(stage=>reviewStats(state.progress,j,stage).pending>0).map(stage=>({j,stage})));
 return `${button('home','← Moja nauka','back')}<h1>Kocia rozgrzewka</h1><p class="lead">Mała porcja ćwiczeń, wyraźny koniec. Wybierz zakres i poćwicz, kiedy masz ochotę.</p>
 ${state.progress.active?`<section class="panel"><h2>Masz rozpoczętą sesję</h2>${button('resume','Kontynuuj rozpoczętą sesję')}</section>`:''}
 <section class="panel"><h2>Cały poznany materiał kursu</h2><p>Do 8 zadań: słówka i gramatyka, także te, które już dobrze znasz. Trudniejsze rzeczy wracają częściej. Za ukończenie nowej sesji: +1 ★.</p><button class="primary" data-action="extra-training" ${known.length?'':'disabled'}>Zacznij rozgrzewkę →</button>${known.length?'':'<p>Najpierw spróbuj kilku zadań w lekcji. Potem wróć tutaj na krótką rozgrzewkę.</p>'}</section>
 <section class="panel"><h2>Wybrany moduł</h2><p>Możesz zrobić kilka krótkich sesji pod rząd, na przykład przed sprawdzianem.</p><div class="actions">${modules.map(m=>`<button class="secondary" data-action="extra-training" data-module="${e(m.id)}" ${known.some(v=>v.item.moduleId===m.id)?'':'disabled'}>Rozgrzewka: ${e(m.cover)}</button>`).join('')}</div></section>
 <section class="panel"><h2>Poćwicz wybrany temat</h2><p>To dodatkowa możliwość ćwiczenia trudniejszych zadań. Każdy zestaw ma własne zakończenie; nie wpływa na ukończenie mapy.</p><div class="actions">${topics.map(({j,stage})=>`<button class="secondary" data-action="stage-review" data-id="${stage.id}" data-journey="${e(journeyKey(j))}">${e(stage.title)}</button>`).join('')||'<p>Na razie nie ma osobnych tematów do przećwiczenia. Możesz wybrać rozgrzewkę z poznanego materiału.</p>'}</div><details><summary>Inne zadania do poćwiczenia</summary><div class="actions">${modules.filter(m=>m.words.some(w=>state.progress.words[keyFor(m,'word',w.id)]==='review'||state.progress.difficult.includes(keyFor(m,'word',w.id)))||m.exercises.some(q=>state.progress.difficult.includes(keyFor(m,'exercise',q.id)))).map(m=>`<button class="secondary" data-action="mode" data-mode="review" data-module="${e(m.id)}">Trudniejsze zadania: ${e(m.cover)}</button>`).join('')}</div></details></section>`;
}
