// Kontroler konta widzi tylko wąski AccountState (najwęższy dostęp do stanu) — bez AppState i bez DOM-u.
// Firebase, synchronizacja, magazyn, sieć i okno potwierdzenia to jawne porty.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAccountController,type AccountState} from '../src/controllers/account.ts';
import {emptyProgress,type Progress} from '../src/learning/model.ts';
import type {AccountSubmit} from '../src/app/form-payloads.ts';

const login=(f:{email:string,password:string,name?:string,reset?:boolean}):AccountSubmit=>({kind:'login',name:'',reset:false,...f});
const account={uid:'u1',email:'a@b.pl',displayName:'Hania'};

function setup(opts:{online?:boolean,confirm?:boolean,login?:()=>Promise<unknown>}={}){
 const state:AccountState={progress:emptyProgress(),guestProgress:emptyProgress(),user:null,reauthNeeded:true,screen:'home',accountSection:'password',registerAccount:true,pending:{} as AccountState['pending'],lastSession:{} as AccountState['lastSession'],accountError:'',accountNotice:'',authWorking:false};
 const calls:string[]=[],stored:unknown[]=[],downloads:string[]=[],tasks:Promise<void>[]=[];
 const cloud=emptyProgress();cloud.words={'a@1:word:x':'known'};
 const sync={
  cache:{progress:cloud,recovery:null as Progress|null},conflict:null as {remote?:{progress:Progress}}|null,
  connect:async(uid:string)=>{calls.push('connect:'+uid);},disconnect:async()=>{calls.push('disconnect');},sync:async()=>{calls.push('sync');},
  useGuest:async()=>{calls.push('useGuest');},dismissGuest:()=>{calls.push('dismissGuest');},resolve:async(w:string)=>{calls.push('resolve:'+w);},
 };
 const sdk={
  login:opts.login??(async()=>account),logout:async()=>{calls.push('logout');},restoreUser:async()=>({...account,displayName:'Nowe'}),
  resetPassword:async(e:string)=>{calls.push('reset:'+e);},changeName:async(n:string)=>({...account,displayName:n}),
  changeEmail:async()=>{calls.push('changeEmail');},changePassword:async()=>{calls.push('changePassword');},
 };
 const guest=emptyProgress();guest.words={'g@1:word:y':'known'};
 const controller=createAccountController(state,{
  sync:sync as never,scheduleSync:d=>{calls.push('schedule:'+d);},downloadProgress:async(_p,s)=>{downloads.push(s??'');},
  run:async task=>{const t=task();tasks.push(t);await t;},restoreCourse:async()=>{calls.push('restoreCourse');},
  firebase:async()=>sdk as never,deadline:p=>p,isOnline:()=>opts.online??true,confirm:()=>opts.confirm??true,
  loadGuestProgress:async()=>guest,storeUser:async u=>{stored.push(u);},
 });
 const press=(action:string)=>controller.handleAction(action as never);
 const submit=async(form:AccountSubmit)=>{controller.handleSubmit(form);await Promise.all(tasks);};
 return {state,press,submit,calls,stored,downloads,sync,cloud,guest,controller};
}

test('logowanie: łączy konto, przełącza postępy na chmurowe i zapamiętuje użytkownika',async()=>{
 const {state,submit,calls,stored,cloud}=setup();
 await submit(login({email:'a@b.pl',password:'x'}));
 assert.deepEqual(state.user,account);assert.equal(state.reauthNeeded,false);
 assert.equal(state.screen,'account');assert.equal(state.accountSection,'name');assert.equal(state.registerAccount,false);
 assert.deepEqual(state.progress,cloud);assert.notEqual(state.progress,cloud,'kopia, nie ta sama referencja');
 assert.equal(state.pending,null);assert.equal(state.lastSession,null);
 assert.match(state.accountNotice,/Zalogowano/);assert.equal(state.accountError,'');assert.equal(state.authWorking,false);
 assert.deepEqual(stored,[account]);assert.deepEqual(calls,['connect:u1','restoreCourse','schedule:0']);
});

test('logowanie: błąd Firebase daje komunikat i zdejmuje blokadę',async()=>{
 const {state,submit,calls}=setup({login:async()=>{throw {code:'auth/invalid-credential'};}});
 await submit(login({email:'a@b.pl',password:'x'}));
 assert.equal(state.accountError,'Nieprawidłowy e-mail lub hasło.');assert.equal(state.authWorking,false);assert.equal(state.user,null);assert.deepEqual(calls,[]);
});

test('logowanie bez internetu: komunikat, bez wywołania Firebase',async()=>{
 const {state,submit,calls}=setup({online:false});
 await submit(login({email:'a@b.pl',password:'x'}));
 assert.match(state.accountError,/wymagają internetu/);assert.equal(state.user,null);assert.deepEqual(calls,[]);
});

test('odzyskanie hasła: wysyła reset i ustawia powiadomienie',async()=>{
 const {state,submit,calls}=setup();
 await submit(login({email:'a@b.pl',password:'',reset:true}));
 assert.deepEqual(calls,['reset:a@b.pl']);assert.match(state.accountNotice,/odzyskiwanie hasła/);assert.equal(state.user,null);
});

test('wylogowanie: wraca do zapisu gościa, czyści sesję i zostawia komunikat',async()=>{
 const {state,press,calls,stored,guest}=setup();
 state.user={...account};
 assert.equal(await press('logout'),true);
 assert.equal(state.user,null);assert.equal(state.reauthNeeded,false);assert.deepEqual(state.progress,guest);assert.deepEqual(state.guestProgress,guest);
 assert.equal(state.pending,null);assert.equal(state.lastSession,null);assert.match(state.accountNotice,/Wylogowano/);assert.equal(state.authWorking,false);
 assert.deepEqual(stored,[null]);assert.deepEqual(calls,['logout','disconnect','restoreCourse']);
});

test('zmiana imienia: zapamiętuje konto z odpowiedzi; zmiana hasła wymaga zgodnych haseł',async()=>{
 const {state,submit,calls}=setup();
 state.user={...account};
 await submit({kind:'profile',name:'Ala'});
 assert.equal(state.user?.displayName,'Ala');assert.equal(state.accountSection,'name');assert.equal(state.accountNotice,'Imię zostało zapisane.');
 await submit({kind:'password',password:'a',next:'b',confirm:'c'});
 assert.match(state.accountError,/nie są takie same/);assert.equal(state.accountSection,'password');assert.deepEqual(calls,[]);
 await submit({kind:'password',password:'a',next:'b',confirm:'b'});
 assert.deepEqual(calls,['changePassword']);assert.match(state.accountNotice,/Hasło zostało zmienione/);assert.equal(state.accountError,'');
});

test('zmiana ustawień bez internetu: komunikat, konto bez zmian',async()=>{
 const {state,submit}=setup({online:false});
 state.user={...account};
 await submit({kind:'email',email:'n@b.pl',password:'a'});
 assert.match(state.accountError,/wymaga internetu/);assert.equal(state.accountSection,'email');
});

test('odświeżenie konta: zmienione konto przerywa z komunikatem',async()=>{
 const {state,press}=setup();
 state.user={...account,uid:'inne'};
 await press('refresh-account');
 assert.equal(state.accountError,'Konto się zmieniło. Zaloguj się ponownie.');
 state.user={...account};
 await press('refresh-account');
 assert.equal(state.accountError,'');assert.equal(state.accountNotice,'Dane konta zostały odświeżone.');assert.equal(state.user?.displayName,'Nowe');
});

test('ekran konta i przełącznik rejestracji czyszczą błąd',async()=>{
 const {state,press}=setup();
 state.accountError='x';await press('account');
 assert.equal(state.screen,'account');assert.equal(state.accountError,'');
 state.accountError='x';await press('auth-toggle');
 assert.equal(state.registerAccount,false);assert.equal(state.accountError,'');
});

test('wybór zapisu: potwierdzenie decyduje, czy zapis zostanie podmieniony',async()=>{
 const no=setup({confirm:false});
 await no.press('resolve-cloud');assert.deepEqual(no.calls,[]);
 const yes=setup();
 await yes.press('resolve-local');await yes.press('resolve-cloud');assert.deepEqual(yes.calls,['resolve:local','resolve:cloud']);
 await yes.press('guest-skip');assert.equal(yes.calls.at(-1),'dismissGuest');
});

test('guest-copy: pyta o zgodę tylko, gdy bieżące postępy coś zawierają',async()=>{
 const empty=setup({confirm:false});
 await empty.press('guest-copy');assert.deepEqual(empty.calls,['useGuest','schedule:0']);
 const filled=setup({confirm:false});filled.state.progress.words={'a@1:word:x':'known'};
 await filled.press('guest-copy');assert.deepEqual(filled.calls,[]);
});

test('eksport: chmura i kopia sprzed zmiany idą przez port pobierania',async()=>{
 const {press,downloads,sync}=setup();
 assert.equal(await press('export-recovery'),false,'bez kopii nic nie robi');
 sync.cache.recovery=emptyProgress();
 await press('export-cloud');await press('export-recovery');
 assert.deepEqual(downloads,['konto','sprzed-zmiany']);
});

test('sync-now i obce akcje',async()=>{
 const {press,calls}=setup();
 await press('sync-now');assert.deepEqual(calls,['sync']);
 assert.equal(await press('export'),false,'akcja innego kontrolera');
});
