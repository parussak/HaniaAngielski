import { normalizeAnswer } from './answers.ts';
import type {Adventure} from './adventure.ts';
import type {HistorySummary,HistoryPage} from './history.ts';
export interface Illustration { symbol?: string; src?: string; caption: string; scene?:boolean }
export interface Word { illustration?: Illustration; id: string; front: string; back: string; group?: string; source?: string; answers?: string[]; rev?: number }
export interface Exercise { dialogue?: {speaker:string;text:string}[]; illustration?: Illustration; responseType?: 'choice'; id: string; wordId?: string; kind: 'vocabulary' | 'grammar' | 'dialogue'; prompt: string; answers: string[]; options: string[]; explanation: string; requires: string[]; caseSensitive: boolean; source?: string; ruleId?: string; rev?: number }
export interface GrammarRule { id: string; title: string; explanation: string; examples: string[]; source: string }
export interface Module { id: string; version: number; order: number; name: string; subtitle: string; language: string; source: string; label: string; cover: string; topics: string[]; words: Word[]; exercises: Exercise[]; grammar: GrammarRule[]; basicFlashcardIds?: string[] }
export type Mode = 'flashcards' | 'flashcards-basic' | 'quiz' | 'grammar' | 'dialogue' | 'review' | 'lesson';
export const isFlashcardMode = (mode: Mode) => mode === 'flashcards' || mode === 'flashcards-basic';
export type AnswerMode = 'choice' | 'text' | 'mixed';
export interface Item { key: string; moduleId: string; version: number; type: 'word' | 'exercise'; id: string; input: 'choice' | 'text' }
export interface Attempt { lastAnswer?: string; key: string; first: boolean; answer: string; corrections: number; corrected: boolean }
export interface Session { lesson?:{id:string;title:string}; id: string; moduleId: string; mode: Mode; answerMode: AnswerMode; previous: boolean; startedAt: string; completedAt: string | null; items: Item[]; index: number; phase: 'question' | 'revealed' | 'feedback' | 'retry'; lastCorrect: boolean | null; attempts: Attempt[]; repeatKeys: string[] }
export interface Progress { adventure?:Adventure; history?:HistorySummary; version: 1; sessions: Session[]; active: Session | null; words: Record<string, 'known' | 'review'>; difficult: string[] }
export interface Backup { archives?:HistoryPage[]; app: 'hania-language'; version: 1; exportedAt: string; progress: Progress }
export const emptyProgress = (): Progress => ({ version: 1, sessions: [], active: null, words: {}, difficult: [] });
export const revisionFor = (module: Module, type: Item['type'], id: string) => (type==='word' ? module.words.find(w=>w.id===id) : module.exercises.find(q=>q.id===id))?.rev ?? 1;
export const keyFor = (module: Module, type: Item['type'], id: string) => `${module.id}@${revisionFor(module,type,id)}:${type}:${id}`;
function shuffle<T>(input: T[], random = Math.random) {
  const result=[...input];
  for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}
export function optionsFor(exercise: Exercise, session: Pick<Session,'id'|'index'>) {
  let seed=2166136261;
  for(const ch of `${session.id}:${session.index}`)seed=Math.imul(seed^ch.charCodeAt(0),16777619)>>>0;
  return shuffle(exercise.options,()=>{seed=(seed+0x6D2B79F5)>>>0;let t=Math.imul(seed^(seed>>>15),1|seed);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;});
}
export function requiresChoice(q: Exercise) {
  return q.responseType === 'choice' || /[([][^)\]]*\s\/\s[^)\]]*[)\]]/.test(q.prompt);
}
export function inputFor(q: Exercise, preferred: Item['input']) {
  return requiresChoice(q) ? 'choice' : preferred;
}
export function eligibleModules(modules: Module[], selected: Module, previous: boolean) {
  return modules.filter(m => m.id === selected.id || (previous && m.order < selected.order));
}
export function makeSession(modules: Module[], selected: Module, mode: Mode, answerMode: AnswerMode, previous: boolean, progress: Progress): Session {
  const available = eligibleModules(modules, selected, previous);
  const allowed = new Set(available.map(m => m.id));
  const items: Item[] = [];
  for (const m of available) {
    if (isFlashcardMode(mode) || mode === 'review') {
      for (const w of m.words) {
        if (mode==='flashcards-basic' && m.basicFlashcardIds && !m.basicFlashcardIds.includes(w.id)) continue;
        const key=keyFor(m,'word',w.id);
        if (mode==='review' && !progress.difficult.includes(key) && progress.words[key]!=='review') continue;
        if (isFlashcardMode(mode) && progress.words[key]==='known') continue;
        items.push({ key, moduleId: m.id, version: w.rev ?? 1, type: 'word', id: w.id, input: 'text' });
      }
    }
    if (!isFlashcardMode(mode)) {
      for (const e of m.exercises) {
        const key = keyFor(m, 'exercise', e.id);
        if (!e.requires.every(id => allowed.has(id))) continue;
        if (mode === 'grammar' && e.kind !== 'grammar') continue;
        if (mode === 'quiz' && e.kind !== 'vocabulary') continue;
        if (mode === 'dialogue' && e.kind !== 'dialogue') continue;
        if (mode === 'review' && !progress.difficult.includes(key)) continue;
        items.push({ key, moduleId: m.id, version: e.rev ?? 1, type: 'exercise', id: e.id, input: 'text' });
      }
    }
  }
  const seen=new Set([...Object.keys(progress.history?.items??{}),...Object.keys(progress.words),...progress.sessions.flatMap(s=>s.attempts.map(a=>a.key)),...(progress.active?.attempts.map(a=>a.key)??[])]);
  const priority=(item: Item)=>progress.difficult.includes(item.key)||progress.words[item.key]==='review'?0:!seen.has(item.key)?1:2;
  const selectedItems=[0,1,2].flatMap(rank=>shuffle(items.filter(i=>priority(i)===rank))).slice(0,10);
  let questionIndex=0;
  for(const item of selectedItems){item.input=inputFor(questionFor(modules,item),answerMode==='mixed'?(questionIndex++%2?'text':'choice'):answerMode);}
  return { id: crypto.randomUUID(), moduleId: selected.id, mode, answerMode, previous, startedAt: new Date().toISOString(), completedAt: null, items: selectedItems, index: 0, phase: 'question', lastCorrect: null, attempts: [], repeatKeys: [] };
}
export function resolveItem(modules: Module[], item: Item) {
  const m = modules.find(m => m.id === item.moduleId);
  const element=item.type === 'word' ? m?.words.find(w => w.id === item.id) : m?.exercises.find(e => e.id === item.id);
  return element && (element.rev??1)===item.version ? element : undefined;
}
// Fiszki korzystają z odpowiedzi i wariantów z materiału słownikowego.
export function questionFor(modules: Module[], item: Item): Exercise {
  const data = resolveItem(modules,item);
  if (!data) throw new Error('Brak materiału do pytania.');
  if (item.type === 'exercise') return data as Exercise;
  const word = data as Word;
  const module = modules.find(m=>m.id===item.moduleId)!;
  const linked = module.exercises.find(q=>q.kind==='vocabulary' && q.wordId===word.id);
  const answers = word.answers ?? [word.back];
  const options = linked?.options ?? [word.back,...module.words.filter(w=>!answers.some(a=>normalizeAnswer(a)===normalizeAnswer(w.back))).map(w=>w.back).filter((v,i,a)=>a.indexOf(v)===i).slice(0,2)];
  return { illustration:word.illustration, id:word.id, kind:'vocabulary', prompt:word.front, answers, options, explanation:linked?.explanation ?? '„'+word.back+'” oznacza „'+word.front+'”.', requires:[module.id], caseSensitive:false, source:word.source };
}
export function sessionCompatible(modules: Module[], s: Session) { return s.items.every(item => !!resolveItem(modules, item)); }
export function isCorrect(exercise: Exercise, answer: string) {
  return exercise.answers.some(a => normalizeAnswer(a,exercise.caseSensitive) === normalizeAnswer(answer,exercise.caseSensitive));
}
export function recordAnswer(p: Progress, exercise: Exercise, answer: string) {
  const s = p.active;
  if (!s || !['question', 'retry', 'revealed'].includes(s.phase)) return;
  const item = s.items[s.index];
  const correct = isCorrect(exercise, answer);
  let attempt = s.attempts.find(a => a.key === item.key);
  const firstInSession = !attempt;
  if (!attempt) { attempt = { key: item.key, first: correct, answer, corrections: 0, corrected: false }; s.attempts.push(attempt); }
  else { attempt.corrections++; attempt.corrected ||= correct; }
  attempt.lastAnswer = answer;
  if (!correct) {
    if (!p.difficult.includes(item.key)) p.difficult.push(item.key);
    if (!s.repeatKeys.includes(item.key)) {
      s.repeatKeys.push(item.key);
      s.items.push({ ...item });
    }
  } else if (firstInSession && !s.repeatKeys.includes(item.key)) p.difficult = p.difficult.filter(k => k !== item.key);
  if (item.type === 'word') p.words[item.key] = correct && firstInSession && !s.repeatKeys.includes(item.key) ? 'known' : 'review';
  s.phase = 'feedback'; s.lastCorrect = correct;
  return correct;
}
export function markWord(p: Progress, known: boolean) {
  const s = p.active;
  if (!s || s.phase !== 'revealed') return;
  const item = s.items[s.index];
  if (item.type !== 'word') return;
  p.words[item.key] = known && !s.repeatKeys.includes(item.key) ? 'known' : 'review';
  if (!known && !p.difficult.includes(item.key)) p.difficult.push(item.key);
  if (known && !s.repeatKeys.includes(item.key) && !s.items.slice(0,s.index).some(i=>i.key===item.key)) p.difficult=p.difficult.filter(k=>k!==item.key);
  if (!known && !s.repeatKeys.includes(item.key)) { s.repeatKeys.push(item.key); s.items.push({ ...item }); }
  next(p);
}
export function next(p: Progress) {
  const s = p.active;
  if (!s) return;
  s.index++; s.phase = 'question'; s.lastCorrect = null;
  if (s.index >= s.items.length) { s.completedAt = new Date().toISOString(); p.sessions.push(s); p.active = null; }
}
export function score(s: Session) { return { total: s.attempts.length, correct: s.attempts.filter(a => a.first).length, corrections: s.attempts.filter(a => a.corrected).length }; }
export function currentStats(modules: Module[], progress: Progress) {
  const wordKeys=new Set(modules.flatMap(m=>m.words.map(w=>keyFor(m,'word',w.id))));
  const exerciseKeys=new Set(modules.flatMap(m=>m.exercises.map(q=>keyFor(m,'exercise',q.id))));
  const keys=new Set([...wordKeys,...exerciseKeys]);
  const review=new Set([...progress.difficult,...Object.entries(progress.words).filter(([,v])=>v==='review').map(([key])=>key)].filter(k=>keys.has(k)));
  const attempts=progress.sessions.flatMap(s=>s.attempts).filter(a=>keys.has(a.key));
  const archived=Object.entries(progress.history?.items??{}).filter(([key])=>keys.has(key)).map(([,v])=>v);
  const total=attempts.length+archived.reduce((n,v)=>n+v.total,0),correct=attempts.filter(a=>a.first).length+archived.reduce((n,v)=>n+v.correct,0);
  return {known:Object.entries(progress.words).filter(([key,value])=>wordKeys.has(key)&&value==='known').length,review:review.size,total,accuracy:total?Math.round(correct/total*100):null};
}

// Import jest traktowany jako niezaufane dane. Sprawdzamy także zagnieżdżony stan sesji.
export function validateBackup(input: unknown): Backup {
  const fail = (): never => { throw new Error('Plik nie jest poprawną lub obsługiwaną kopią postępów. Obecne dane pozostają bez zmian.'); };
  const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
  const str = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 2000;
  const date = (v: unknown): boolean => str(v) && Number.isFinite(Date.parse(v));
  const strings = (v: unknown): v is string[] => Array.isArray(v) && v.length <= 100000 && v.every(str);
  const integer = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0;
  const validSession = (v: unknown, completed: boolean): boolean => {
    if (!obj(v) || !str(v.id) || !str(v.moduleId) || !['flashcards','flashcards-basic','quiz','grammar','dialogue','review','lesson'].includes(v.mode as string) || !['choice','text','mixed'].includes(v.answerMode as string) || typeof v.previous !== 'boolean' || !date(v.startedAt) || !(completed ? date(v.completedAt) : v.completedAt === null) || !['question','revealed','feedback','retry'].includes(v.phase as string) || !(v.lastCorrect === null || typeof v.lastCorrect === 'boolean')) return false;
    if(v.lesson!==undefined && (!obj(v.lesson)||!str(v.lesson.id)||!str(v.lesson.title)||v.mode!=='lesson'))return false;
    if(v.mode==='lesson'&&!v.lesson)return false;
    if (!Array.isArray(v.items) || !v.items.length || v.items.length > 1000 || !integer(v.index) || (completed ? v.index !== v.items.length : v.index >= v.items.length) || !strings(v.repeatKeys)) return false;
    if (!v.items.every(i => obj(i) && str(i.key) && str(i.moduleId) && integer(i.version) && i.version > 0 && ['word','exercise'].includes(i.type as string) && str(i.id) && ['text','choice'].includes(i.input as string) && i.key === `${i.moduleId}@${i.version}:${i.type}:${i.id}`)) return false;
    if (!Array.isArray(v.attempts) || v.attempts.length > v.items.length || !v.attempts.every(a => obj(a) && str(a.key) && typeof a.first === 'boolean' && typeof a.answer === 'string' && a.answer.length <= 2000 && (a.lastAnswer === undefined || (typeof a.lastAnswer === 'string' && a.lastAnswer.length <= 2000)) && integer(a.corrections) && typeof a.corrected === 'boolean' && (v.items as Item[]).some(i => i.key === a.key))) return false;
    if (new Set(v.attempts.map(a => a.key)).size !== v.attempts.length) return false;
    if (!(v.repeatKeys as string[]).every(k => (v.items as Item[]).some(i => i.key === k))) return false;
    if (!completed) {
      const current = v.items[v.index] as Item;
      if (v.phase === 'revealed' && current.type !== 'word') return false;
      if (['feedback','retry'].includes(v.phase as string) && !v.attempts.some(a => a.key === current.key)) return false;
    }
    return true;
  };
  if (!obj(input) || input.app !== 'hania-language' || input.version !== 1 || !date(input.exportedAt) || !obj(input.progress)) return fail();
  const p = input.progress;
  if (p.version !== 1 || !Array.isArray(p.sessions) || p.sessions.length > 10000 || !p.sessions.every(s => validSession(s, true)) || !(p.active === null || validSession(p.active, false)) || !obj(p.words) || !Object.entries(p.words).every(([k,v]) => str(k) && ['known','review'].includes(v as string)) || !strings(p.difficult)) return fail();
  const ids = p.sessions.map(s => s.id);
  if (new Set(ids).size !== ids.length || (p.active && ids.includes((p.active as Session).id))) return fail();
  const safeKey=(key:string)=>str(key)&&!['__proto__','prototype','constructor'].includes(key);
  const totals=(v:unknown)=>obj(v)&&integer(v.total)&&integer(v.correct)&&(v.correct as number)<=(v.total as number);
  if(p.history!==undefined){
    const h=p.history;
    if(!obj(h)||!(h.head===null||typeof h.head==='string'&&/^[a-f0-9]{64}$/.test(h.head))||!integer(h.sessions)||!obj(h.items)||!obj(h.modules)||!Object.entries(h.items).every(([k,v])=>safeKey(k)&&totals(v))||!Object.entries(h.modules).every(([k,v])=>safeKey(k)&&totals(v)&&obj(v)&&integer(v.sessions)))return fail();
    if((h.head===null)!==(h.sessions===0)||Object.values(h.modules).reduce<number>((n,v)=>n+(v as {sessions:number}).sessions,0)!==h.sessions)return fail();
  }
  if(p.adventure!==undefined){
    const a=p.adventure,slotIds=['left','window','right','rug','shelf','front'];
    if(!obj(a)||a.version!==1||!integer(a.earned)||!obj(a.completed)||!Object.entries(a.completed).every(([k,v])=>safeKey(k)&&obj(v)&&date(v.at))||!obj(a.purchases)||!Object.entries(a.purchases).every(([k,v])=>safeKey(k)&&obj(v)&&integer(v.cost)&&(v.slot===null||slotIds.includes(v.slot as string)))||(a.reviewDay!==undefined&&!(typeof a.reviewDay==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(a.reviewDay))))return fail();
    const purchases=Object.values(a.purchases) as {cost:number;slot:string|null}[];
    if(purchases.reduce((n,v)=>n+v.cost,0)>(a.earned as number)||new Set(purchases.filter(v=>v.slot).map(v=>v.slot)).size!==purchases.filter(v=>v.slot).length)return fail();
  }
  if(input.archives!==undefined){
    if(!Array.isArray(input.archives)||!input.archives.every(page=>obj(page)&&typeof page.id==='string'&&/^[a-f0-9]{64}$/.test(page.id)&&(page.previous===null||typeof page.previous==='string'&&/^[a-f0-9]{64}$/.test(page.previous))&&Array.isArray(page.sessions)&&page.sessions.length>0&&page.sessions.every(s=>validSession(s,true))))return fail();
    const archiveIds=new Set<string>(),sessionIds=new Set(ids);for(const page of input.archives){if(archiveIds.has(page.id))return fail();archiveIds.add(page.id);for(const s of page.sessions){if(sessionIds.has(s.id)||(p.active as Session|null)?.id===s.id)return fail();sessionIds.add(s.id);}}
  }
  return structuredClone(input) as unknown as Backup;
}
export function backup(p: Progress): Backup { return { app: 'hania-language', version: 1, exportedAt: new Date().toISOString(), progress: structuredClone(p) }; }
