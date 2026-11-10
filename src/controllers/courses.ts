import type { AppState } from '../app/state.ts';
import { courseKey } from '../learning/scope.ts';
import { journeyKey } from '../adventure.ts';
import { stageForSession } from '../stage-review.ts';

interface CoursePorts {
    read: (key: string) => Promise<unknown>;
    write: (key: string, value: unknown) => Promise<void>;
}
export const coursePreferenceKey = (uid?: string) => `course-selection:${uid ? `account:${uid}` : 'guest'}`;

/** Local UI preference only: no edits to Progress or the cloud document. */
export function createCourseController(state: AppState, ports: CoursePorts) {
    let generation = 0;
    const owner = () => coursePreferenceKey(state.user?.uid);
    function apply(id: string) {
        const course = state.courses.find(c => c.id === id);
        const module = state.modules.find(m => courseKey(m) === course?.id);
        if (!course || !module) return false;
        state.selectedCourseId = course.id;
        if (!state.selected || courseKey(state.selected) !== course.id) state.selected = module;
        state.selectedJourneyKey = '';
        state.introLessonId = '';
        return true;
    }
    async function restore() {
        if (!state.modules.length) { state.selectedCourseId = ''; return; }
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
        catch { state.notice = 'Kurs wybrany na tę wizytę. Nie udało się zapamiętać wyboru na urządzeniu.'; }
        if (generation !== run || owner() !== key) return false;
        return apply(id);
    }
    async function followSession() {
        const m = state.modules.find(m => m.id === state.progress.active?.moduleId);
        if (m && courseKey(m) !== state.selectedCourseId) await select(courseKey(m));
        if (m) state.selected = m;
        const context = state.progress.active && stageForSession(state.journeys, state.progress.active);
        state.selectedJourneyKey = context ? journeyKey(context.journey) : '';
    }
    return { restore, select, followSession };
}
