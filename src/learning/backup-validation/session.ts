import type {Item} from '../model.ts';
import {obj,str,date,strings,integer} from './values.ts';

export const validItem = (i: unknown): boolean => obj(i) && str(i.key) && str(i.moduleId) && integer(i.version) && i.version > 0 && ['word', 'exercise'].includes(i.type as string) && str(i.id) && ['text', 'choice'].includes(i.input as string) && i.key === `${i.moduleId}@${i.version}:${i.type}:${i.id}` &&
    (i.pairGroup===undefined||str(i.pairGroup)&&i.type==='word'&&i.input==='choice'&&i.presentation===undefined)&&
    (i.gapGroup===undefined||str(i.gapGroup)&&i.type==='exercise'&&i.input==='choice'&&i.presentation==='bank'&&i.pairGroup===undefined)&&
    (i.presentation===undefined||i.presentation==='bank'&&i.type==='exercise'&&i.input==='choice')&&
    (i.sceneGroup===undefined||str(i.sceneGroup)&&i.type==='exercise'&&i.pairGroup===undefined&&i.gapGroup===undefined&&i.presentation===undefined)&&
    (i.options === undefined || Array.isArray(i.options) && i.options.length >= 2 && i.options.length <= 4 && i.options.every(str) && new Set(i.options).size === i.options.length);
export const validSession = (v: unknown, completed: boolean): boolean => {
    if(obj(v)){
        if(v.boardSummary!==undefined&&(v.boardSummary!==true||completed||v.phase!=='feedback'||v.lastCorrect!==true))return false;
        if(v.gapSelection!==undefined&&(!str(v.gapSelection)||completed||!Array.isArray(v.items)||!integer(v.index)||!obj(v.items[v.index])||v.items[v.index].presentation!=='bank'))return false;
        if(v.gapPlacements!==undefined&&(!obj(v.gapPlacements)||completed||!Array.isArray(v.items)||!integer(v.index)||!obj(v.items[v.index])||v.items[v.index].presentation!=='bank'||!Object.entries(v.gapPlacements).every(([key,value])=>str(value)&&(v.items as Item[]).some(i=>i.key===key&&(i.gapGroup?(v.items as Item[])[v.index as number].gapGroup===i.gapGroup:i.key===(v.items as Item[])[v.index as number].key)))))return false;
        if(v.legendary!==undefined&&(v.legendary!==true||v.mode!=='lesson'||!obj(v.lesson)))return false;
        if(v.pairSelection!==undefined&&(!str(v.pairSelection)||completed||!Array.isArray(v.items)||!integer(v.index)||!obj(v.items[v.index])||!v.items[v.index].pairGroup||!v.items.slice(v.index).some(i=>obj(i)&&i.key===v.pairSelection&&i.pairGroup===(v.items as Item[])[v.index as number].pairGroup)))return false;
        if(v.draftAnswer!==undefined&&(typeof v.draftAnswer!=='string'||v.draftAnswer.length>2000||completed||!Array.isArray(v.items)||!integer(v.index)||!obj(v.items[v.index])||v.items[v.index].presentation!=='bank'))return false;
        if(v.retentionCounted!==undefined&&(v.retentionCounted!==true||!completed))return false;
        if(v.ritual!==undefined&&(!['opening','finale'].includes(v.ritual as string)||v.mode!=='training'||!obj(v.training)||v.training.kind!=='extra'))return false;
        if(v.recall!==undefined&&(!obj(v.recall)||!str(v.recall.stageId)||!v.recall.stageId.startsWith(`${v.moduleId}/`)||v.mode!=='lesson'||!obj(v.lesson)||!str(v.lesson.id)||!v.lesson.id.startsWith(`${v.moduleId}/`)||v.training!==undefined||v.stageReview!==undefined||v.scope!==undefined||v.ritual!==undefined||v.fixedLength!==true))return false;
        if(obj(v.recall)&&typeof v.recall.stageId==='string'&&obj(v.lesson)){
            const id=v.recall.stageId;
            if(!/^[a-z0-9-]+\/[a-z0-9-]+(?:\/[a-z0-9-]+)?$/.test(id)||![`${id}-recall-1`,`${id}-recall-2`].includes(v.lesson.id as string))return false;
        }
    }
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
    const groups=new Set((v.items as Item[]).flatMap(i=>i.pairGroup?[i.pairGroup]:[]));
    for(const key of groups){const indices=(v.items as Item[]).flatMap((i,index)=>i.pairGroup===key?[index]:[]);if(indices.length<2||indices.length>3||indices.at(-1)!-indices[0]!==indices.length-1||!(v.items as Item[]).some(i=>i.key===key&&i.pairGroup===key))return false;}
    const gapGroups=new Set((v.items as Item[]).flatMap(i=>i.gapGroup?[i.gapGroup]:[]));
    for(const key of gapGroups){const indices=(v.items as Item[]).flatMap((i,index)=>i.gapGroup===key?[index]:[]);if(indices.length!==2||indices[1]!==indices[0]+1||!(v.items as Item[]).some(i=>i.key===key&&i.gapGroup===key))return false;}
    const sceneGroups=new Set((v.items as Item[]).flatMap(i=>i.sceneGroup?[i.sceneGroup]:[]));
    for(const key of sceneGroups){const indices=(v.items as Item[]).flatMap((i,index)=>i.sceneGroup===key?[index]:[]);if(indices.length>6||indices.at(-1)!-indices[0]!==indices.length-1||(v.items as Item[])[indices[0]].key!==key)return false;}
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
