import type {Progress,Session} from '../model.ts';
import type {Adventure} from '../../adventure.ts';
import {obj,str,strings} from './values.ts';
import {validSession} from './session.ts';
import {validAdventure} from './adventure.ts';
import {validHistory} from './history.ts';

// Local structure first; references spanning the whole backup are checked later.
export function validProgress(p:unknown):p is Progress {
    if(!obj(p))return false;
    if(p.encountered!==undefined&&(!strings(p.encountered)||new Set(p.encountered).size!==p.encountered.length))return false;
    if (p.version !== 1 || !Array.isArray(p.sessions) || p.sessions.length > 10000 || !p.sessions.every(s => validSession(s, true)) || !(p.active === null || validSession(p.active, false)) || !obj(p.words) || !Object.entries(p.words).every(([k, v]) => str(k) && ['known', 'review'].includes(v as string)) || !strings(p.difficult))
        return false;
    const ids = p.sessions.map(s => s.id);
    if (new Set(ids).size !== ids.length || (p.active && ids.includes((p.active as Session).id)))
        return false;
    if(p.history!==undefined&&!validHistory(p.history))return false;
    if(p.adventure!==undefined&&!validAdventure(p.adventure))return false;
    return true;
}

export function validActiveReview(p:Progress):boolean {
    const scoped = (p.active as Session | null)?.stageReview;
    if (scoped) {
        const state = (p.adventure as Adventure | undefined)?.stageReviews?.[scoped.id];
        if (!state || state.round >= scoped.round || !(p.active as Session).items.every(item => Object.hasOwn(state.items, item.key)))
            return false;
    }
    return true;
}
