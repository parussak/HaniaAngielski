import type {Session} from '../model.ts';
import {obj} from './values.ts';
import {validSession} from './session.ts';

export function validArchives(archives:unknown,ids:string[],active:Session|null):boolean {
    if (!Array.isArray(archives) || !archives.every(page => obj(page) && typeof page.id === 'string' && /^[a-f0-9]{64}$/.test(page.id) && (page.previous === null || typeof page.previous === 'string' && /^[a-f0-9]{64}$/.test(page.previous)) && Array.isArray(page.sessions) && page.sessions.length > 0 && page.sessions.every(s => validSession(s, true))))
        return false;
    const archiveIds = new Set<string>(), sessionIds = new Set(ids);
    for (const page of archives) {
        if (archiveIds.has(page.id))
            return false;
        archiveIds.add(page.id);
        for (const s of page.sessions) {
            if (sessionIds.has(s.id) || active?.id === s.id)
                return false;
            sessionIds.add(s.id);
        }
    }
    return true;
}
