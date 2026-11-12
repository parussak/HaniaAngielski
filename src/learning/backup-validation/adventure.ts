import {legacyCourse} from '../../materials/identity.ts';
import {obj,integer,safeKey,date} from './values.ts';
import {validHome} from './home.ts';
import {validItem} from './session.ts';
import {validAdaptiveState} from './adaptive.ts';

export function validAdventure(a:unknown):boolean {
    if(!validAdaptiveState(a))return false;
    if (!obj(a) || a.version !== 1 || !validHome(a) || !obj(a.completed) || !Object.entries(a.completed).every(([k, v]) => safeKey(k) && obj(v) && date(v.at) && (v.edition === undefined || v.edition === 2)) || (a.reviewDay !== undefined && !(typeof a.reviewDay === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(a.reviewDay))))
        return false;
    if(a.courseHomes!==undefined&&(!obj(a.courseHomes)||!Object.entries(a.courseHomes).every(([id,h])=>safeKey(id)&&/^[a-z0-9-]+$/.test(id)&&id!==legacyCourse&&validHome(h))))return false;
    if (a.reviewSchema !== undefined && a.reviewSchema !== 1)
        return false;
    if (a.reviewArchiveHead !== undefined && a.reviewArchiveHead !== null && !(typeof a.reviewArchiveHead === 'string' && /^[a-f0-9]{64}$/.test(a.reviewArchiveHead)))
        return false;
    if (a.stageReviews !== undefined) {
        if (!obj(a.stageReviews) || !Object.entries(a.stageReviews).every(([key, state]) => {
            if (!/^[a-z0-9-]+\/[a-z0-9-]+(?:\/[a-z0-9-]+)?$/.test(key) || !obj(state) || !integer(state.round) || !obj(state.items) || (state.rewardedAt !== undefined && !date(state.rewardedAt)))
                return false;
            return Object.entries(state.items).every(([itemKey, entry]) => obj(entry) && validItem(entry.item) && obj(entry.item) && entry.item.key === itemKey && integer(entry.correct) && entry.correct <= 3 && integer(entry.due) && (entry.correct === 3 ? entry.due === 0 : entry.due > 0));
        }))
            return false;
    }
    return true;
}
