import type {Journey} from '../learning/journey.ts';
import type { Module, Progress } from '../learning/model.ts';
import type { Course } from '../materials/model.ts';
import { courseKey } from '../learning/scope.ts';
import {journeyKey} from '../learning/journey.ts';
import { stageForSession } from '../stage-review.ts';

/**
 * Jedyne, co kontroler kursów widzi ze stanu (najwęższy dostęp). Dane do odczytu są `readonly`
 * — postęp zmienia wyłącznie port `mutate` gdzie indziej, tu nie zmienia się wcale.
 * Reszta to stan ekranu zmieniany nazwanymi operacjami kontrolera.
 */
export interface CourseState {
    readonly courses: readonly Course[];
    readonly modules: readonly Module[];
    readonly journeys: Journey[];
    readonly progress: Pick<Progress, 'active' | 'sessions'>;
    readonly user: { readonly uid: string } | null;
    selectedCourseId: string;
    selected?: Module;
    selectedJourneyKey: string;
    introLessonId: string;
    houseOverview: boolean;
    chosenRoom: string;
    chosenDecoration: string;
    notice: string;
}
interface CoursePorts {
    read: (key: string) => Promise<unknown>;
    write: (key: string, value: unknown) => Promise<void>;
}
export const coursePreferenceKey = (uid?: string) => `course-selection:${uid ? `account:${uid}` : 'guest'}`;

/** Local UI preference only: no edits to Progress or the cloud document. */
export function createCourseController(state: CourseState, ports: CoursePorts) {
    let generation = 0;
    const owner = () => coursePreferenceKey(state.user?.uid);
    // Każde pole stanu ekranu zmienia jedna nazwana operacja.
    const notify = (message: string) => { state.notice = message; };
    const clearCourse = () => { state.selectedCourseId = ''; };
    const showModule = (module: Module) => { state.selected = module; };
    const showJourney = (key: string) => { state.selectedJourneyKey = key; };
    function enterCourse(course: Course, module: Module) {
        state.selectedCourseId = course.id;
        if (!state.selected || courseKey(state.selected) !== course.id) showModule(module);
        showJourney('');
        state.introLessonId = '';
        state.houseOverview = true;
        state.chosenRoom = 'salon';
        state.chosenDecoration = 'pillow';
    }
    function apply(id: string) {
        const course = state.courses.find(c => c.id === id);
        const module = state.modules.find(m => courseKey(m) === course?.id);
        if (!course || !module) return false;
        enterCourse(course, module);
        return true;
    }
    async function restore() {
        if (!state.modules.length) { clearCourse(); return; }
        const run = ++generation, key = owner();
        let saved: unknown;
        try { saved = await ports.read(key); } catch { /* Learning works without a saved UI preference. */ }
        if (generation !== run || owner() !== key) return;
        const active = state.modules.find(m => m.id === state.progress.active?.moduleId);
        const recent = [...state.progress.sessions].reverse().map(s => state.modules.find(m => m.id === s.moduleId)).find(Boolean);
        const id = typeof saved === 'object' && saved !== null && 'version' in saved && saved.version === 1 && 'courseId' in saved && typeof saved.courseId === 'string' ? saved.courseId : '';
        if (!apply(id)) apply(courseKey(active ?? recent ?? state.modules[0]));
    }
    async function select(id: string) {
        if (!state.courses.some(c => c.id === id)) return false;
        const key = owner(), run = ++generation;
        try { await ports.write(key, { version: 1, courseId: id }); }
        catch { notify('Kurs wybrany na tę wizytę. Nie udało się zapamiętać wyboru na urządzeniu.'); }
        if (generation !== run || owner() !== key) return false;
        return apply(id);
    }
    async function followSession() {
        const m = state.modules.find(m => m.id === state.progress.active?.moduleId);
        if (m && courseKey(m) !== state.selectedCourseId) await select(courseKey(m));
        if (m) showModule(m);
        const context = state.progress.active && stageForSession(state.journeys, state.progress.active);
        showJourney(context ? journeyKey(context.journey) : '');
    }
    return { restore, select, followSession };
}
