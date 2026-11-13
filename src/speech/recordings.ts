import {speechKey} from './text.ts';
export interface Recording {text:string;language:string;file:string}
export function recordingCatalog(value:unknown):Recording[]{
 const c=value as {version:number;entries:Recording[]};
 if(c?.version!==1||!Array.isArray(c.entries)||c.entries.length>20000)throw Error('Niepoprawny indeks nagrań.');
 const seen=new Set<string>();
 return c.entries.map(entry=>{
  if(!entry||typeof entry.text!=='string'||!entry.text.trim()||entry.text.length>1000||typeof entry.language!=='string'||!/^\w+(?:[-_]\w+)*$/.test(entry.language)||typeof entry.file!=='string'||!/^clips\/[a-f0-9]{64}\.ogg$/.test(entry.file))throw Error('Niepoprawne nagranie.');
  const key=speechKey(entry.text,entry.language);if(seen.has(key))throw Error('Powtórzony tekst nagrania.');seen.add(key);return {...entry};
 });
}
