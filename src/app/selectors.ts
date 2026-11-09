import { AppState } from './state.ts';
import { currentStats, sessionCompatible } from '../core.ts';
export function compatible(state: Readonly<AppState>) { return !state.progress.active || sessionCompatible(state.modules, state.progress.active); }
export function stats(state: Readonly<AppState>) { return currentStats(state.modules, state.progress); }
export function currentJourney(state: Readonly<AppState>) { return state.journeys.find(j => j.moduleId === state.selected?.id) ?? state.journeys[0]; }
