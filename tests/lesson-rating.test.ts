import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyProgress,makeSession} from '../src/core.ts';
import {engineModule} from './fixtures/engine.ts';
import {lessonRating} from '../src/learning/statistics.ts';
import {retryAnswer} from '../src/learning/retry.ts';
import {recordAnswer,questionFor} from '../src/core.ts';
import {next} from '../src/core.ts';
const m=engineModule();
test('łapki: połówki w dół, komplet wyłącznie za wszystkie poprawne pierwsze odpowiedzi',()=>{
 const s=makeSession([m],m,'quiz','text',false,emptyProgress());s.items=s.items.slice(0,8);
 for(const [correct,expected] of [[0,0],[1,0],[2,0.5],[4,1.5],[7,2.5],[8,3]]){
  s.attempts=s.items.map((i,n)=>({key:i.key,first:n<correct,answer:'odpowiedź',corrections:2,corrected:true}));
  assert.equal(lessonRating(s),expected);
 }
 const before=structuredClone(s);assert.equal(lessonRating(s),3);assert.deepEqual(s,before);
 s.items.push({...s.items[0]});assert.equal(lessonRating(s),3);
 s.attempts.pop();assert.equal(lessonRating(s),2.5);
 s.attempts=[];assert.equal(lessonRating(s),null);
});
test('zwykła ponowna próba nie usuwa błędu ani zdobytych gwiazdek',()=>{
 const p=emptyProgress();p.adventure={version:1,earned:19,purchases:{},completed:{}};p.active=makeSession([m],m,'quiz','text',false,p);
 recordAnswer(p,questionFor([m],p.active!.items[0]),'wrong');const first=structuredClone(p.active!.attempts[0]);
 assert.equal(retryAnswer(p),true);assert.deepEqual(p.active!.attempts[0],first);assert.equal(p.active!.phase,'retry');assert.equal(p.adventure.earned,19);
});
test('dawny powrót tego samego zadania również można poprawić, zachowując pierwszą poprawną próbę',()=>{
 const p=emptyProgress();p.active=makeSession([m],m,'quiz','text',false,p);const s=p.active!,item=s.items[0];s.items=[item,{...item}];
 const q=questionFor([m],item);recordAnswer(p,q,q.answers[0]);next(p);recordAnswer(p,q,'wrong');
 assert.equal(retryAnswer(p),true);assert.equal(s.index,1);assert.equal(s.phase,'retry');assert.equal(s.attempts[0].first,true);
});
