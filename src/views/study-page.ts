import { AppState } from '../app/state.ts';
import type { Session } from '../learning/model.ts';
import { sessionTitle } from '../learning-labels.ts';
import { coursePracticeLabels, type CoursePracticeMode } from '../learning/course-practice.ts';
import { act, e, icon } from '../ui.ts';
/** The frame around a study card: back button, heading, progress bar and the save note. */
export function studyPage(state: Readonly<AppState>, s: Session, card: string) {
    const percent = Math.round(s.index / s.items.length * 100);
    return `<button class="back" ${act('home')}>← Wróć do modułów · sesja zostaje zapisana</button><div class="study-heading"><div><div class="eyebrow">${s.scope?e(state.courses.find(c=>c.id===s.scope!.courseId)?.name??'POZNANY MATERIAŁ KURSU'):'TWÓJ MAŁY KROK'}</div><h1>${e(s.scope ? coursePracticeLabels[s.mode as CoursePracticeMode] : sessionTitle(s))}</h1></div><span class="tag">${s.index + 1} / ${s.items.length}</span></div><div class="progress-track" role="progressbar" aria-label="Pytanie ${s.index + 1} z ${s.items.length}" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><span style="width:${percent}%"></span></div><section class="study-card">${card}</section><p class="under-card">${icon('check')} ${state.storageError ? 'Zapis niedostępny — zapisz kopię przed zamknięciem.' : 'Każdy krok zapisuje się na tym urządzeniu.'}</p>`;
}
