// Kontroler kopii widzi tylko wąski BackupState (najwęższy dostęp do stanu) — bez AppState i bez DOM-u.
// Plik, zapis stron historii i `mutate` to jawne porty; dane postępu zmienia wyłącznie `mutate`.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createBackupController,type BackupState} from '../src/controllers/backup.ts';
import {backup} from '../src/learning/backup.ts';
import {emptyProgress,type Progress} from '../src/learning/model.ts';
import type {ImportFile} from '../src/app/form-payloads.ts';
import type {HistoryPage} from '../src/history.ts';

function setup(){
 const state:BackupState={progress:emptyProgress(),olderSessions:[],olderHead:undefined,pending:null,notice:'',storageError:''};
 let current=state.progress;const saves:string[]=[],files:{name:string,text:string}[]=[],pages:HistoryPage[]=[];
 const controller=createBackupController(state,{
  mutate:async(change:(p:Progress)=>void)=>{const draft=structuredClone(current);change(draft);current=draft;},
  getHistoryPage:async()=>{throw new Error('Brak strony historii.');},
  saveHistoryPage:async page=>{pages.push(page);saves.push(page.id);},
  saveFile:(name,text)=>{files.push({name,text});},
  run:async task=>{await task();},
 });
 const press=(action:string)=>controller.handleAction(action as never);
 const choose=(file:ImportFile)=>controller.importFile(file);
 const jsonFile=(text:string)=>({size:text.length,text:async()=>text});
 return {state,press,choose,jsonFile,progress:()=>current,files,saves};
}

test('export: przygotowuje plik kopii i zostawia komunikat dla użytkownika',async()=>{
 const {state,press,files}=setup();
 assert.equal(await press('export'),true);
 assert.equal(files.length,1);assert.match(files[0].name,/^hania-postepy-\d{4}-\d{2}-\d{2}\.json$/);
 assert.ok(JSON.parse(files[0].text).progress,'plik zawiera postępy');
 assert.match(state.notice,/Plik kopii został przygotowany/);
});

test('wybór pliku: poprawna kopia czeka na potwierdzenie, nic nie jest jeszcze zapisane',async()=>{
 const {state,choose,jsonFile,progress}=setup(),before=progress();
 await choose(jsonFile(JSON.stringify(backup(emptyProgress()))));
 assert.ok(state.pending,'kopia czeka na potwierdzenie');assert.equal(state.notice,'');assert.equal(progress(),before);
});

test('wybór pliku: niepoprawny JSON i zbyt duży plik dają komunikat, bez zmiany danych',async()=>{
 const {state,choose,jsonFile,progress}=setup(),before=progress();
 await choose(jsonFile('to nie jest json'));
 assert.equal(state.pending,null);assert.match(state.notice,/Nie można odczytać tego pliku JSON/);
 await choose({size:51*1024*1024,text:async()=>''});
 assert.match(state.notice,/za duży/);assert.equal(progress(),before);
});

test('confirm-import: zapisuje postępy przez mutate, czyści oczekującą kopię i błąd zapisu',async()=>{
 const {state,press,choose,jsonFile,progress}=setup();
 assert.equal(await press('confirm-import'),false,'bez wybranej kopii nic nie robi');
 const imported=emptyProgress();imported.words={'a@1:word:x':'known'};
 await choose(jsonFile(JSON.stringify(backup(imported))));state.storageError='błąd';
 assert.equal(await press('confirm-import'),true);
 assert.equal(state.pending,null);assert.equal(state.storageError,'');assert.match(state.notice,/Kopia została wczytana/);
 assert.deepEqual(progress().words,imported.words);
});

test('cancel-import: porzuca oczekującą kopię',async()=>{
 const {state,press,choose,jsonFile}=setup();
 await choose(jsonFile(JSON.stringify(backup(emptyProgress()))));
 assert.equal(await press('cancel-import'),true);assert.equal(state.pending,null);
});

test('older-history: bez głowy nic nie robi, błąd pobrania trafia do komunikatu',async()=>{
 const {state,press}=setup();
 assert.equal(await press('older-history'),true);assert.equal(state.notice,'');
 state.olderHead='x';
 assert.equal(await press('older-history'),true);assert.equal(state.notice,'Brak strony historii.');assert.equal(state.olderHead,'x');
});
