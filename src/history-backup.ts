import { backup,validateBackup,type Backup,type Progress } from './core.ts';
import { checkPage,historyPages,type HistoryPage } from './history.ts';

export async function validateFullBackup(input:unknown):Promise<Backup>{
  const b=validateBackup(input);
  if(!b.progress.history?.head){if(b.archives?.length||b.progress.adventure?.reviewArchiveHead)throw new Error('Kopia zawiera niepowiązaną historię.');return b;}
  const available=new Map((b.archives??[]).map(page=>[page.id,page]));
  if(b.progress.adventure?.reviewArchiveHead&&!available.has(b.progress.adventure.reviewArchiveHead))throw new Error('W kopii brakuje części historii potrzebnej do odtworzenia powtórek.');
  const pages=await historyPages(b.progress.history.head,async id=>{const page=available.get(id);if(!page)throw new Error('W kopii brakuje części starszej historii. Pobierz pełną kopię z aplikacji.');return checkPage(page);});
  const sessions=pages.flatMap(page=>page.sessions);
  if(pages.length!==available.size||sessions.length!==b.progress.history.sessions)throw new Error('Niezgodna liczba sesji w kopii historii.');
  const items:Record<string,{total:number;correct:number}>={},mods:Record<string,{sessions:number;total:number;correct:number}>={};
  for(const s of sessions){
    if(['__proto__','constructor','prototype'].includes(s.moduleId))throw new Error('Niepoprawny moduł historii.');
    const mod=mods[s.moduleId]??{sessions:0,total:0,correct:0};mod.sessions++;
    for(const a of s.attempts){const stat=items[a.key]??{total:0,correct:0};stat.total++;stat.correct+=Number(a.first);items[a.key]=stat;mod.total++;mod.correct+=Number(a.first);}
    mods[s.moduleId]=mod;
  }
  const same=(a:Record<string,unknown>,b:Record<string,unknown>)=>Object.keys(a).length===Object.keys(b).length&&Object.entries(a).every(([key,value])=>{
    const x=value as Record<string,number>,y=b[key] as Record<string,number>|undefined;
    return !!y&&Object.keys(x).length===Object.keys(y).length&&Object.entries(x).every(([k,v])=>y[k]===v);
  });
  if(!same(items,b.progress.history.items)||!same(mods,b.progress.history.modules))throw new Error('Podsumowanie nie zgadza się z historią w kopii.');
  return b;
}
export async function fullBackup(p:Progress,get:(id:string)=>Promise<HistoryPage>):Promise<Backup>{
  const b=backup(p);
  if(p.history?.head)b.archives=await historyPages(p.history.head,get);
  return validateFullBackup(b);
}
