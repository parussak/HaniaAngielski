import { emptyProgress,validateBackup,backup,type Progress } from './core.ts';
import {checkPage,byteSize,type HistoryPage} from './history.ts';
let dbPromise: Promise<IDBDatabase> | undefined;
export const storageNamespace = `hania-language:${typeof location === 'undefined' ? 'test' : new URL('.', location.href).pathname}`;
function database() {
  return dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(storageNamespace, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('progress');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Zamknij pozostałe karty aplikacji i spróbuj ponownie.'));
  });
}
export async function readStored<T>(key: string): Promise<T | undefined> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('progress', 'readonly');
    const request = tx.objectStore('progress').get(key);
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error);
  });
}
export async function writeStored(key: string, value: unknown): Promise<void> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('progress', 'readwrite');
    tx.objectStore('progress').put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('Zapis przerwany'));
  });
}
export async function load(): Promise<Progress> { return (await readStored<Progress>('current')) ?? emptyProgress(); }
export async function save(p: Progress): Promise<void> { await writeStored('current',p); }
export async function putHistoryPage(page:HistoryPage){
  if(!page || !/^[a-f0-9]{64}$/.test(page.id)||byteSize(page)>200000)throw new Error('Niepoprawna część historii.');
  validateBackup(backup({...emptyProgress(),sessions:page.sessions}));await checkPage(page);
  await writeStored(`history-page:${page.id}`,page);
}
export async function localHistoryPage(id:string){return readStored<HistoryPage>(`history-page:${id}`);}
