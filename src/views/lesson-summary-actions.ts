import type {AppState} from '../app/state.ts';
import type {Session} from '../learning/model.ts';
import {followingLesson,lessonContext} from '../learning/lesson-flow.ts';
import {courseModules} from '../app/selectors.ts';
import {grammarTopicPool,lessonTopicIds} from '../learning/grammar-topics.ts';
import { act, button,e } from '../ui.ts';
/** D-74: after a lesson that teaches rules with topics, practise those topics (only tried exercises). */
function grammarPractice(state:Readonly<AppState>,s:Session,context:ReturnType<typeof lessonContext>){
 const module=state.modules.find(m=>m.id===s.moduleId),anchor=courseModules(state)[0];
 if(!context||!module||!anchor||!courseModules(state).includes(module))return '';
 const topics=lessonTopicIds(module,context.lesson);
 return topics.length&&grammarTopicPool(state.modules,anchor,state.progress,topics).length?`<button class="secondary" ${act('grammar-practice')} data-id="${e(topics.join(','))}">Poćwicz gramatykę</button>`:'';
}
export function lessonSummaryActions(state:Readonly<AppState>,s:Session){
 const next=followingLesson(state.modules,state.journeys,state.progress,s),replay=lessonContext(state.journeys,state.progress,s);
 return `<div class="actions journey-summary-actions lesson-finish-actions">${next?button('following-lesson','Kolejna lekcja →'):'<button class="primary" disabled>Kolejna lekcja</button>'}${replay?button('legendary','Poziom legendarny ★','secondary'):'<button class="secondary" disabled>Poziom legendarny ★</button>'}${button('map','Wróć do mapy','secondary')}${grammarPractice(state,s,replay)}</div><p class="lesson-finish-note">${next?'Idź dalej lub powtórz całą lekcję na poziomie legendarnym (+1 ★).':'Wszystkie dostępne lekcje ukończone albo kolejna mapa wymaga wczytania. Możesz powtórzyć lekcję na poziomie legendarnym (+1 ★).'}</p>`;
}
