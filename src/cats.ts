import type { Session,Scene } from './core.ts';

export type CatMood='teacher'|'happy'|'celebrating'|'funny';
export interface CatFrame { sheet:string; x:number; y:number; width:number; height:number; clip?:number[][] }
export interface Cat { id:string; name:string; teacher:CatFrame; happy:CatFrame; celebrating:CatFrame; funny:CatFrame[] }
export interface CatCatalog { version:1; sheets:Record<string,{src:string;width:number;height:number}>; cats:Cat[] }
export interface CatReaction { cat:Cat; mood:CatMood; frame:CatFrame }

export function validateCats(value:unknown):CatCatalog {
  const c=value as CatCatalog;
  const fail=():never=>{throw new Error('Niepoprawny katalog kotków.');};
  if(!c || c.version!==1 || !c.sheets || !Array.isArray(c.cats) || c.cats.length<2)return fail();
  for(const sheet of Object.values(c.sheets))if(!sheet || !/^cats\/[a-z0-9-]+\.png$/.test(sheet.src) || !Number.isSafeInteger(sheet.width) || sheet.width<1 || !Number.isSafeInteger(sheet.height) || sheet.height<1)return fail();
  const ids=new Set<string>();
  for(const cat of c.cats){
    if(!cat || !/^[a-z0-9-]+$/.test(cat.id) || ids.has(cat.id) || typeof cat.name!=='string' || !cat.name.trim() || cat.name.length>50 || !Array.isArray(cat.funny) || !cat.funny.length)return fail();
    ids.add(cat.id);
    for(const frame of [cat.teacher,cat.happy,cat.celebrating,...cat.funny]){
      const sheet=frame && Object.hasOwn(c.sheets,frame.sheet)?c.sheets[frame.sheet]:undefined;
      if(!sheet || ![frame.x,frame.y,frame.width,frame.height].every(Number.isSafeInteger) || frame.x<0 || frame.y<0 || frame.width<1 || frame.height<1 || frame.x+frame.width>sheet.width || frame.y+frame.height>sheet.height)return fail();
      if(frame.clip && (!Array.isArray(frame.clip) || frame.clip.length<3 || !frame.clip.every(p=>Array.isArray(p) && p.length===2 && p.every(Number.isSafeInteger) && p[0]>=frame.x && p[0]<=frame.x+frame.width && p[1]>=frame.y && p[1]<=frame.y+frame.height)))return fail();
    }
  }
  return structuredClone(c);
}
export async function loadCats():Promise<CatCatalog|null> {
  try{
    const response=await fetch(new URL('cats/catalog.json',document.baseURI),{cache:'no-cache'});
    if(!response.ok)return null;
    return validateCats(await response.json());
  }catch{return null;} // Niedostępna dekoracja nie blokuje nauki ani postępów.
}
function hash(value:string){let seed=2166136261;for(const char of value)seed=Math.imul(seed^char.charCodeAt(0),16777619)>>>0;return seed;}
function order(catalog:CatCatalog,sessionId:string){
  return [...catalog.cats].sort((a,b)=>hash(`${sessionId}:${a.id}`)-hash(`${sessionId}:${b.id}`)||a.id.localeCompare(b.id));
}
/** Stable casting from the saved session id: no new progress or image assets. */
export function sceneCats(catalog:CatCatalog,session:Pick<Session,'id'>,scene:Pick<Scene,'id'|'lines'>){
 const cats=order(catalog,`${session.id}:dialogue:${scene.id}`),speakers=[...new Set(scene.lines.map(line=>line.speaker))];
 return new Map(speakers.map((speaker,index)=>[speaker,cats[index%cats.length]]));
}
export function responseCat(catalog:CatCatalog,session:Session):CatReaction {
  // Losowa kolejność na sesję, bez sąsiednich powtórek. Powrót do tego samego
  // pytania i odpowiedzi daje ten sam kotek, również po wczytaniu kopii.
  const cats=order(catalog,session.id),cat=cats[session.index%cats.length];
  const attempt=session.attempts.find(a=>a.key===session.items[session.index]?.key);
  const mood=session.lastCorrect?(hash(`${session.id}:${session.index}:${attempt?.corrections??0}`)%2?'happy':'celebrating'):'teacher';
  return {cat,mood,frame:cat[mood]};
}
export function endingCat(catalog:CatCatalog,session:Pick<Session,'id'>):CatReaction {
  const cats=order(catalog,session.id),cat=cats[hash(`${session.id}:ending`)%cats.length];
  return {cat,mood:'funny',frame:cat.funny[hash(`${session.id}:scene`)%cat.funny.length]};
}
