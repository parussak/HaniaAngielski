import type {AppState} from '../app/state.ts';
import type {Session} from '../learning/model.ts';
import {followingLesson,lessonContext} from '../learning/lesson-flow.ts';
import {button} from '../ui.ts';
export function lessonSummaryActions(state:Readonly<AppState>,s:Session){
 const next=followingLesson(state.modules,state.journeys,state.progress,s),replay=lessonContext(state.journeys,state.progress,s);
 return `<div class="actions journey-summary-actions lesson-finish-actions">${next?button('following-lesson','Kolejna lekcja →'):'<button class="primary" disabled>Kolejna lekcja</button>'}${replay?button('legendary','Poziom legendarny ★','secondary'):'<button class="secondary" disabled>Poziom legendarny ★</button>'}${button('map','Wróć do mapy','secondary')}</div><p class="lesson-finish-note">${next?'Idź dalej lub powtórz całą lekcję na poziomie legendarnym (+1 ★).':'Wszystkie dostępne lekcje ukończone albo kolejna mapa wymaga wczytania. Możesz powtórzyć lekcję na poziomie legendarnym (+1 ★).'}</p>`;
}
