import type { AppState } from '../app/state.ts';
import { courseModules, currentCourse, compatible } from '../app/selectors.ts';
import { coursePracticeLabels, coursePracticePool, type CoursePracticeMode } from '../learning/course-practice.ts';
import { courseKey } from '../learning/scope.ts';
import { button, e, icon } from '../ui.ts';
function knownCount(n: number, words: boolean) {
    const few = n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14);
    return `${n} ${n === 1 ? words ? 'poznane hasło' : 'poznane pytanie' : few ? words ? 'poznane hasła' : 'poznane pytania' : words ? 'poznanych haseł' : 'poznanych pytań'}`;
}

export function courseContext(state: Readonly<AppState>) {
    const course = currentCourse(state);
    return course ? `<div class="course-context"><div><span>TWÓJ KURS</span><strong>${e(course.name)}</strong></div>${button('courses', 'Wybierz kurs', 'text-button')}</div>` : '';
}

export function unfinishedCourseSession(state: Readonly<AppState>, onlyOther = false) {
    const active = state.progress.active;
    if (!active) return '';
    const module = state.modules.find(m => m.id === active.moduleId);
    const id = active.scope?.courseId ?? (module ? courseKey(module) : '');
    if (onlyOther && id === currentCourse(state)?.id) return '';
    const name = state.courses.find(c => c.id === id)?.name ?? 'wcześniejszego materiału';
    return `<div class="alert course-resume"><p>Masz rozpoczętą sesję: <strong>${e(name)}</strong>. Zmiana kursu jej nie usuwa.</p>${compatible(state) ? button('resume', 'Wróć do rozpoczętej sesji', 'text-button') : button('backup', 'Zapisz kopię postępów', 'text-button')}</div>`;
}

export function coursesView(state: Readonly<AppState>) {
    const selected = currentCourse(state)?.id;
    return `${button('home', '← Moja nauka', 'back')}<h1>Wybierz kurs</h1><p class="lead">Każdy kurs prowadzi przez jeden podręcznik. Twoje wyniki pozostają osobne.</p><div class="courses-grid">${state.courses.map(course => {
        const modules = state.modules.filter(m => courseKey(m) === course.id);
        return `<article class="panel course-card ${selected === course.id ? 'is-selected' : ''}"><span class="stat-icon lavender" aria-hidden="true">${icon('book')}</span><h2>${e(course.name)}</h2><p>${e(modules[0]?.language ?? course.targetLanguage)}${course.levels ? ` · ${course.levels.map(e).join('–')}` : ''}</p>${course.textbook.title ? `<p>${e(course.textbook.title)}</p>` : ''}<p>${modules.length} ${modules.length === 1 ? 'moduł' : modules.length < 5 ? 'moduły' : 'modułów'}</p>${selected === course.id ? '<p class="course-selected">Wybrany kurs ✓</p>' : ''}<button class="${selected === course.id ? 'secondary' : 'primary'}" data-action="select-course" data-id="${e(course.id)}" aria-label="Wybierz kurs ${e(course.name)}">Ucz się tego kursu →</button></article>`;
    }).join('')}</div>${unfinishedCourseSession(state)}`;
}

export function coursePracticeView(state: Readonly<AppState>) {
    const course = currentCourse(state), anchor = courseModules(state)[0];
    if (!course || !anchor) return `${button('courses','Wybierz kurs')}<p>Ten kurs nie ma dostępnych materiałów.</p>`;
    const modes = ['flashcards', 'quiz', 'grammar'] as CoursePracticeMode[];
    const counts = Object.fromEntries(modes.map(mode => [mode, coursePracticePool(state.modules, anchor, state.progress, mode).length]));
    return `${button('home','← Moja nauka','back')}${courseContext(state)}<h1>Cały poznany materiał</h1><p class="lead">Wracaj do tego, co już ćwiczysz w tym kursie — także do odpowiedzi bez błędów.</p>${unfinishedCourseSession(state)}<section class="panel"><fieldset><legend>Sposób odpowiadania</legend><div class="segmented">${([['choice','Wybieram odpowiedź'],['text','Wpisuję odpowiedź'],['mixed','Trochę wybieram, trochę wpisuję']] as const).map(([value,label])=>`<label><input type="radio" name="answerMode" value="${value}" ${state.answerMode===value?'checked':''}><span>${label}</span></label>`).join('')}</div></fieldset><div class="mode-grid">${modes.map(mode=>`<button class="mode-card" data-action="course-mode" data-mode="${mode}" ${counts[mode]?'':'disabled'}><span class="stat-icon ${mode==='grammar'?'lavender':'mint'}" aria-hidden="true">${icon(mode==='flashcards'?'cards':mode==='grammar'?'book':'spark')}</span><strong>${coursePracticeLabels[mode]} →</strong><span>${knownCount(counts[mode],mode==='flashcards')}</span></button>`).join('')}</div>${modes.every(mode=>counts[mode]===0)?'<p class="course-empty" role="status">Najpierw spróbuj odpowiedzieć na kilka pytań na mapie lub w module. Tutaj będą wracać poznane słówka i gramatyka.</p>':''}<p class="muted">Do 10 zadań w sesji. Materiał jest poznany po pierwszej próbie odpowiedzi, także błędnej. Samo obejrzenie wprowadzenia nie wystarcza. Gdy brakuje poznanych opcji do wyboru, odpowiedź wpiszesz.</p></section><div class="actions">${button('journeys','Wybierz przygodę','secondary')}${button('module-list','Przejdź do modułów','text-button')}</div>`;
}
