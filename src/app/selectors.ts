import { AppState } from './state.ts';
import { currentStats, sessionCompatible } from '../core.ts';
import { journeyKey } from '../adventure.ts';
import { courseKey } from '../learning/scope.ts';
export function compatible(state: Readonly<AppState>) { return !state.progress.active || sessionCompatible(state.modules, state.progress.active); }
export function stats(state: Readonly<AppState>) { return currentStats(state.modules, state.progress); }
export function currentCourse(state: Readonly<AppState>) { return state.courses.find(c => c.id === state.selectedCourseId) ?? state.courses.find(c => c.id === (state.selected && courseKey(state.selected))) ?? state.courses[0]; }
export function courseModules(state: Readonly<AppState>) { const id = currentCourse(state)?.id; return id ? state.modules.filter(m => courseKey(m) === id) : state.modules; }
export function courseJourneys(state: Readonly<AppState>) { const allowed = new Set(courseModules(state).map(m => m.id)); return state.journeys.filter(j => allowed.has(j.moduleId)); }
export function currentJourney(state: Readonly<AppState>) { const journeys=courseJourneys(state);return journeys.find(j => j.moduleId === state.selected?.id && journeyKey(j) === state.selectedJourneyKey) ?? journeys.find(j => j.moduleId === state.selected?.id) ?? journeys[0]; }
