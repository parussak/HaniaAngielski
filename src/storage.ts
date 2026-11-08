import { emptyProgress, type Progress } from './core.ts';
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
export async function load(): Promise<Progress> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('progress', 'readonly');
    const request = tx.objectStore('progress').get('current');
    tx.oncomplete = () => resolve(request.result ?? emptyProgress());
    tx.onerror = () => reject(tx.error);
  });
}
export async function save(p: Progress): Promise<void> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('progress', 'readwrite');
    tx.objectStore('progress').put(p, 'current');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('Zapis przerwany'));
  });
}
