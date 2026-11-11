import {obj,integer,safeKey,totals} from './values.ts';

export function validHistory(h:unknown):boolean {
    if (!obj(h) || !(h.head === null || typeof h.head === 'string' && /^[a-f0-9]{64}$/.test(h.head)) || !integer(h.sessions) || !obj(h.items) || !obj(h.modules) || !Object.entries(h.items).every(([k, v]) => safeKey(k) && totals(v)) || !Object.entries(h.modules).every(([k, v]) => safeKey(k) && totals(v) && obj(v) && integer(v.sessions)))
        return false;
    if(h.courses!==undefined&&(!obj(h.courses)||!Object.entries(h.courses).every(([k,v])=>safeKey(k)&&totals(v)&&obj(v)&&integer(v.sessions))))return false;
    if ((h.head === null) !== (h.sessions === 0) || [...Object.values(h.modules),...Object.values(h.courses??{})].reduce<number>((n, v) => n + (v as {
        sessions: number;
    }).sessions, 0) !== h.sessions)
        return false;
    return true;
}
