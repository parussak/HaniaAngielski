import type { Adventure } from '../adventure.ts';
import { type Backup, type Item, type Progress, type Session } from './model.ts';
export function validateBackup(input: unknown): Backup {
    const fail = (): never => { throw new Error('Plik nie jest poprawną lub obsługiwaną kopią postępów. Obecne dane pozostają bez zmian.'); };
    const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
    const str = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 2000;
    const date = (v: unknown): boolean => str(v) && Number.isFinite(Date.parse(v));
    const strings = (v: unknown): v is string[] => Array.isArray(v) && v.length <= 100000 && v.every(str);
    const integer = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0;
    const validItem = (i: unknown): boolean => obj(i) && str(i.key) && str(i.moduleId) && integer(i.version) && i.version > 0 && ['word', 'exercise'].includes(i.type as string) && str(i.id) && ['text', 'choice'].includes(i.input as string) && i.key === `${i.moduleId}@${i.version}:${i.type}:${i.id}` &&
        (i.options === undefined || Array.isArray(i.options) && i.options.length >= 2 && i.options.length <= 4 && i.options.every(str) && new Set(i.options).size === i.options.length);
    const validSession = (v: unknown, completed: boolean): boolean => {
        if(obj(v)&&(v.fixedLength!==undefined&&v.fixedLength!==true||v.lessonRewarded!==undefined&&(v.lessonRewarded!==true||!completed||!v.lesson)))return false;
        if (!obj(v) || !str(v.id) || !str(v.moduleId) || !['flashcards', 'flashcards-basic', 'quiz', 'grammar', 'dialogue', 'review', 'lesson', 'training'].includes(v.mode as string) || !['choice', 'text', 'mixed'].includes(v.answerMode as string) || typeof v.previous !== 'boolean' || !date(v.startedAt) || !(completed ? date(v.completedAt) : v.completedAt === null) || !['question', 'revealed', 'feedback', 'retry'].includes(v.phase as string) || !(v.lastCorrect === null || typeof v.lastCorrect === 'boolean'))
            return false;
        if (v.training !== undefined && (!obj(v.training) || !['map','extra'].includes(v.training.kind as string) || (v.training.kind === 'map' ? v.mode !== 'lesson' || v.training.rewarded !== undefined : v.mode !== 'training' || v.lesson !== undefined || v.stageReview !== undefined || v.training.rewarded !== undefined && (v.training.rewarded !== true || !completed))))
            return false;
        if (v.mode === 'training' && (!obj(v.training) || v.training.kind !== 'extra'))
            return false;
        if (v.scope !== undefined && (!obj(v.scope) || v.scope.kind !== 'course' || !str(v.scope.courseId) || !['flashcards','quiz','grammar'].includes(v.mode as string) || v.lesson !== undefined || v.stageReview !== undefined || v.training !== undefined))
            return false;
        if (v.lesson !== undefined && (!obj(v.lesson) || !str(v.lesson.id) || !str(v.lesson.title) || v.mode !== 'lesson' || v.lesson.edition !== undefined && v.lesson.edition !== 2))
            return false;
        if (v.mode === 'lesson' && !v.lesson)
            return false;
        if (v.stageReview !== undefined && (!obj(v.stageReview) || !str(v.stageReview.id) || !v.stageReview.id.startsWith(`${v.moduleId}/`) || !str(v.stageReview.title) || !integer(v.stageReview.round) || v.stageReview.round < 1 || v.mode !== 'review' || v.lesson !== undefined))
            return false;
        if (!Array.isArray(v.items) || !v.items.length || v.items.length > 1000 || !integer(v.index) || (completed ? v.index !== v.items.length : v.index >= v.items.length) || !strings(v.repeatKeys))
            return false;
        if (!v.items.every(validItem))
            return false;
        if (!v.scope && v.items.some(i => obj(i) && i.options !== undefined)) return false;
        if (!Array.isArray(v.attempts) || v.attempts.length > v.items.length || !v.attempts.every(a => obj(a) && str(a.key) && typeof a.first === 'boolean' && typeof a.answer === 'string' && a.answer.length <= 2000 && (a.lastAnswer === undefined || (typeof a.lastAnswer === 'string' && a.lastAnswer.length <= 2000)) && integer(a.corrections) && typeof a.corrected === 'boolean' && (v.items as Item[]).some(i => i.key === a.key)))
            return false;
        if (new Set(v.attempts.map(a => a.key)).size !== v.attempts.length)
            return false;
        if (!(v.repeatKeys as string[]).every(k => (v.items as Item[]).some(i => i.key === k)))
            return false;
        if (!completed) {
            const current = v.items[v.index] as Item;
            if (v.phase === 'revealed' && current.type !== 'word')
                return false;
            if (['feedback', 'retry'].includes(v.phase as string) && !v.attempts.some(a => a.key === current.key))
                return false;
        }
        return true;
    };
    if (!obj(input) || input.app !== 'hania-language' || input.version !== 1 || !date(input.exportedAt) || !obj(input.progress))
        return fail();
    const p = input.progress;
    if(p.encountered!==undefined&&(!strings(p.encountered)||new Set(p.encountered).size!==p.encountered.length))return fail();
    if (p.version !== 1 || !Array.isArray(p.sessions) || p.sessions.length > 10000 || !p.sessions.every(s => validSession(s, true)) || !(p.active === null || validSession(p.active, false)) || !obj(p.words) || !Object.entries(p.words).every(([k, v]) => str(k) && ['known', 'review'].includes(v as string)) || !strings(p.difficult))
        return fail();
    const ids = p.sessions.map(s => s.id);
    if (new Set(ids).size !== ids.length || (p.active && ids.includes((p.active as Session).id)))
        return fail();
    const safeKey = (key: string) => str(key) && !['__proto__', 'prototype', 'constructor'].includes(key);
    const identifiers=(v:unknown)=>strings(v)&&new Set(v).size===v.length&&v.every(id=>/^[a-z0-9-]+$/.test(id)&&safeKey(id));
    const validHome=(h:unknown):boolean=>{
        if(!obj(h)||!integer(h.earned)||!obj(h.purchases)||h.rooms!==undefined&&!identifiers(h.rooms)||h.unlockedItems!==undefined&&!identifiers(h.unlockedItems))return false;
        const places:string[]=[];let spent=0;
        for(const [id,v] of Object.entries(h.purchases)){
            if(!safeKey(id)||!obj(v)||!integer(v.cost)||!(v.slot===null||['left','window','right','rug','shelf','front'].includes(v.slot as string)))return false;
            if(v.room!==undefined&&(typeof v.room!=='string'||v.room!=='salon'&&!(Array.isArray(h.rooms)&&h.rooms.includes(v.room))))return false;
            spent+=v.cost as number;if(v.slot!==null)places.push(`${v.room??'salon'}/${v.slot}`);
        }
        return spent<=(h.earned as number)&&new Set(places).size===places.length;
    };
    const totals = (v: unknown) => obj(v) && integer(v.total) && integer(v.correct) && (v.correct as number) <= (v.total as number);
    if (p.history !== undefined) {
        const h = p.history;
        if (!obj(h) || !(h.head === null || typeof h.head === 'string' && /^[a-f0-9]{64}$/.test(h.head)) || !integer(h.sessions) || !obj(h.items) || !obj(h.modules) || !Object.entries(h.items).every(([k, v]) => safeKey(k) && totals(v)) || !Object.entries(h.modules).every(([k, v]) => safeKey(k) && totals(v) && obj(v) && integer(v.sessions)))
            return fail();
        if(h.courses!==undefined&&(!obj(h.courses)||!Object.entries(h.courses).every(([k,v])=>safeKey(k)&&totals(v)&&obj(v)&&integer(v.sessions))))return fail();
        if ((h.head === null) !== (h.sessions === 0) || [...Object.values(h.modules),...Object.values(h.courses??{})].reduce<number>((n, v) => n + (v as {
            sessions: number;
        }).sessions, 0) !== h.sessions)
            return fail();
    }
    if (p.adventure !== undefined) {
        const a = p.adventure;
        if (!obj(a) || a.version !== 1 || !validHome(a) || !obj(a.completed) || !Object.entries(a.completed).every(([k, v]) => safeKey(k) && obj(v) && date(v.at) && (v.edition === undefined || v.edition === 2)) || (a.reviewDay !== undefined && !(typeof a.reviewDay === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(a.reviewDay))))
            return fail();
        if(a.courseHomes!==undefined&&(!obj(a.courseHomes)||!Object.entries(a.courseHomes).every(([id,h])=>safeKey(id)&&/^[a-z0-9-]+$/.test(id)&&id!=='angielski-hani'&&validHome(h))))return fail();
        if (a.reviewSchema !== undefined && a.reviewSchema !== 1)
            return fail();
        if (a.reviewArchiveHead !== undefined && a.reviewArchiveHead !== null && !(typeof a.reviewArchiveHead === 'string' && /^[a-f0-9]{64}$/.test(a.reviewArchiveHead)))
            return fail();
        if (a.stageReviews !== undefined) {
            if (!obj(a.stageReviews) || !Object.entries(a.stageReviews).every(([key, state]) => {
                if (!/^[a-z0-9-]+\/[a-z0-9-]+(?:\/[a-z0-9-]+)?$/.test(key) || !obj(state) || !integer(state.round) || !obj(state.items) || (state.rewardedAt !== undefined && !date(state.rewardedAt)))
                    return false;
                return Object.entries(state.items).every(([itemKey, entry]) => obj(entry) && validItem(entry.item) && obj(entry.item) && entry.item.key === itemKey && integer(entry.correct) && entry.correct <= 3 && integer(entry.due) && (entry.correct === 3 ? entry.due === 0 : entry.due > 0));
            }))
                return fail();
        }
    }
    if (input.archives !== undefined) {
        if (!Array.isArray(input.archives) || !input.archives.every(page => obj(page) && typeof page.id === 'string' && /^[a-f0-9]{64}$/.test(page.id) && (page.previous === null || typeof page.previous === 'string' && /^[a-f0-9]{64}$/.test(page.previous)) && Array.isArray(page.sessions) && page.sessions.length > 0 && page.sessions.every(s => validSession(s, true))))
            return fail();
        const archiveIds = new Set<string>(), sessionIds = new Set(ids);
        for (const page of input.archives) {
            if (archiveIds.has(page.id))
                return fail();
            archiveIds.add(page.id);
            for (const s of page.sessions) {
                if (sessionIds.has(s.id) || (p.active as Session | null)?.id === s.id)
                    return fail();
                sessionIds.add(s.id);
            }
        }
    }
    const scoped = (p.active as Session | null)?.stageReview;
    if (scoped) {
        const state = (p.adventure as Adventure | undefined)?.stageReviews?.[scoped.id];
        if (!state || state.round >= scoped.round || !(p.active as Session).items.every(item => Object.hasOwn(state.items, item.key)))
            return fail();
    }
    return structuredClone(input) as unknown as Backup;
}
export function backup(p: Progress): Backup { return { app: 'hania-language', version: 1, exportedAt: new Date().toISOString(), progress: structuredClone(p) }; }
