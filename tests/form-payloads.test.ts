// Granica zdarzeń czyta formularze i pola do typowanych danych; kontrolery nie widzą DOM-u (D-78, punkt 3 Konstytucji).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readAccountSubmit,readImportFile,readSetting} from '../src/app/form-payloads.ts';

const submitEvent=(id:string,fields:Record<string,string>,submitter?:string)=>({target:{id,elements:{namedItem:(n:string)=>n in fields?{value:fields[n]}:null}},submitter:submitter?{getAttribute:()=>submitter}:null}) as unknown as SubmitEvent;

test('formularz logowania: e-mail jest przycinany, hasło nie; brak imienia daje pusty tekst',()=>{
 assert.deepEqual(readAccountSubmit(submitEvent('account-form',{email:' a@b.pl ',password:' x '})),{kind:'login',email:'a@b.pl',password:' x ',name:'',reset:false});
 assert.deepEqual(readAccountSubmit(submitEvent('account-form',{email:'a@b.pl',password:'x',displayName:'Ala'})),{kind:'login',email:'a@b.pl',password:'x',name:'Ala',reset:false});
});
test('przycisk „odzyskaj hasło” (submitter value=reset) oznacza reset, inny przycisk nie',()=>{
 assert.equal((readAccountSubmit(submitEvent('account-form',{email:'a',password:''},'reset')) as {reset:boolean}).reset,true);
 assert.equal((readAccountSubmit(submitEvent('account-form',{email:'a',password:''},'login')) as {reset:boolean}).reset,false);
});
test('formularze ustawień konta: imię, e-mail i hasło',()=>{
 assert.deepEqual(readAccountSubmit(submitEvent('profile-form',{displayName:'Ala'})),{kind:'profile',name:'Ala'});
 assert.deepEqual(readAccountSubmit(submitEvent('email-form',{email:' n@b.pl ',currentPassword:'a'})),{kind:'email',email:' n@b.pl ',password:'a'});
 assert.deepEqual(readAccountSubmit(submitEvent('password-form',{currentPassword:'a',newPassword:'b',confirmPassword:'c'})),{kind:'password',password:'a',next:'b',confirm:'c'});
});
test('inny formularz nie jest formularzem konta',()=>{
 assert.equal(readAccountSubmit(submitEvent('answer-form',{})),null);
});

test('plik kopii: pierwszy wybrany plik tylko z pola import-file; brak pliku lub inne pole to null',()=>{
 const file={size:1,text:async()=>''};
 assert.equal(readImportFile({id:'import-file',files:[file]} as unknown as EventTarget),file);
 assert.equal(readImportFile({id:'import-file',files:[]} as unknown as EventTarget),null);
 assert.equal(readImportFile({id:'import-file'} as unknown as EventTarget),null);
 assert.equal(readImportFile({id:'inne',files:[file]} as unknown as EventTarget),null);
 assert.equal(readImportFile(null),null);
});

test('ustawienia nauki: tryb odpowiedzi z pola name, „poprzednie” z pola previous; reszta to null',()=>{
 assert.deepEqual(readSetting({name:'answerMode',id:'',value:'text',checked:false} as unknown as EventTarget),{kind:'answerMode',value:'text'});
 assert.deepEqual(readSetting({name:'',id:'previous',value:'on',checked:true} as unknown as EventTarget),{kind:'previous',checked:true});
 assert.equal(readSetting({name:'x',id:'y',value:'1',checked:true} as unknown as EventTarget),null);
 assert.equal(readSetting(null),null);
});
