import type { Progress,Session } from './core.ts';

export interface HistorySummary {
  head:string|null; sessions:number;
  items:Record<string,{total:number;correct:number}>;
  modules:Record<string,{sessions:number;total:number;correct:number}>;
}
export interface HistoryPage {id:string;previous:string|null;sessions:Session[]}
export const sessionCount=(p:Progress)=>p.sessions.length+(p.history?.sessions??0);
export const byteSize=(v:unknown)=>new TextEncoder().encode(JSON.stringify(v)).length;
export async function pageId(data:Omit<HistoryPage,'id'>){
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(data)));
  return Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
}
export async function checkPage(page:HistoryPage){
  if(await pageId({previous:page.previous,sessions:page.sessions})!==page.id)throw new Error('Uszkodzona część historii. Nie zmieniono wyników.');
  return page;
}
// Immutable pages are persisted BEFORE the small current snapshot changes its
// head. A failed write cannot discard old sessions or leave a dangling head.
export async function compactHistory(input:Progress,put:(page:HistoryPage)=>Promise<void>):Promise<Progress>{
  const p=structuredClone(input);
  let keep=p.sessions.length;
  let bytes=0;
  for(let i=p.sessions.length-1;i>=0;i--){bytes+=byteSize(p.sessions[i]);if(p.sessions.length-i>30 || bytes>90000){keep=Math.max(1,p.sessions.length-i-1);break;}}
  const removed=p.sessions.slice(0,p.sessions.length-keep);
  if(!removed.length)return p;
  const summary:HistorySummary=p.history??{head:null,sessions:0,items:{},modules:{}};
  let group:Session[]=[];
  const flush=async()=>{if(!group.length)return;const data={previous:summary.head,sessions:group};const page={id:await pageId(data),...data};await put(page);summary.head=page.id;group=[];};
  for(const s of removed){
    if(['__proto__','constructor','prototype'].includes(s.moduleId))throw new Error('Niepoprawny identyfikator modułu historii.');
    if(group.length && byteSize([...group,s])>140000)await flush();
    if(byteSize(s)>190000)throw new Error('Pojedyncza sesja jest zbyt duża do archiwizacji. Zachowaj kopię i skontaktuj się z opiekunem aplikacji.');
    group.push(s);summary.sessions++;
    const mod=summary.modules[s.moduleId]??{sessions:0,total:0,correct:0};mod.sessions++;
    for(const a of s.attempts){const stat=summary.items[a.key]??{total:0,correct:0};stat.total++;stat.correct+=Number(a.first);summary.items[a.key]=stat;mod.total++;mod.correct+=Number(a.first);}
    summary.modules[s.moduleId]=mod;
  }
  await flush();p.history=summary;p.sessions=p.sessions.slice(removed.length);return p;
}
export async function historyPages(head:string|null|undefined,get:(id:string)=>Promise<HistoryPage>):Promise<HistoryPage[]>{
  const pages:HistoryPage[]=[],seen=new Set<string>();let id=head;
  while(id){if(seen.has(id))throw new Error('Nieprawidłowe powiązanie części historii.');seen.add(id);const page=await checkPage(await get(id));if(page.id!==id)throw new Error('Nieprawidłowy identyfikator historii.');pages.push(page);id=page.previous;}
  return pages;
}
export async function publishHistory(head:string|null|undefined,remoteHead:string|null|undefined,get:(id:string)=>Promise<HistoryPage>,put:(page:HistoryPage)=>Promise<void>){
  const pages:HistoryPage[]=[],seen=new Set<string>();let id=head;
  while(id&&id!==remoteHead){
    if(seen.has(id))throw new Error('Nieprawidłowy łańcuch historii.');seen.add(id);
    const page=await checkPage(await get(id));if(page.id!==id)throw new Error('Niezgodny identyfikator historii.');pages.push(page);id=page.previous;
  }
  for(const page of pages.reverse())await put(page);
}
