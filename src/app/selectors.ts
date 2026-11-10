import { AppState } from './state.ts';
import { currentStats, sessionCompatible } from '../core.ts';
import { journeyKey } from '../adventure.ts';
export function compatible(state: Readonly<AppState>) { return !state.progress.active || sessionCompatible(state.modules, state.progress.active); }
export function stats(state: Readonly<AppState>) { return currentStats(state.modules, state.progress); }
export function currentJourney(state: Readonly<AppState>) { return state.journeys.find(j => j.moduleId === state.selected?.id && journeyKey(j) === state.selectedJourneyKey) ?? state.journeys.find(j => j.moduleId === state.selected?.id) ?? state.journeys[0]; }
