import {test} from 'node:test';
import assert from 'node:assert/strict';
import {actionOwners} from '../src/app/actions.ts';
import {payloadOf,payloadSchema,readCall} from '../src/app/action-payloads.ts';
import {act} from '../src/ui.ts';

// Granica zdarzeń: z atrybutów `data-*` powstaje typowany payload, a brak wymaganych danych to `null`.
const el=(dataset:Record<string,string>={})=>({dataset}) as unknown as HTMLElement;
const allActions=Object.values(actionOwners).flatMap(actions=>[...actions]);

test('schemat ma wpis dla każdej akcji ze spisu i tylko dla nich',()=>{
 assert.deepEqual(Object.keys(payloadSchema).sort(),[...allActions].sort());
});

test('payload zawiera tylko pola z schematu i zachowuje puste napisy',()=>{
 assert.deepEqual(payloadOf('place-decoration',el({id:'pillow',slot:'',obce:'x'})),{id:'pillow',slot:''});
 assert.deepEqual(payloadOf('select-room',el()),{});
 assert.deepEqual(payloadOf('map',el({id:'m',journey:'j'})),{id:'m',journey:'j'});
});

test('brak wymaganego pola daje null, a pole opcjonalne może zostać pominięte',()=>{
 assert.equal(payloadOf('answer',el()),null);
 assert.deepEqual(payloadOf('answer',el({answer:''})),{answer:''});
 assert.equal(payloadOf('grammar-lesson',el({module:'m',id:'l'})),null);
 assert.deepEqual(payloadOf('grammar-lesson',el({module:'m',journey:'j',id:'l'})),{module:'m',journey:'j',id:'l'});
 assert.equal(payloadOf('select-course',el()),null);
});

test('liczby i znaczniki są czytane z napisów; akcja bez danych nie ma payloadu',()=>{
 assert.deepEqual(payloadOf('grid-move',el({id:'p',x:'5',y:'12',owner:'guest'})),{id:'p',x:5,y:12,owner:'guest'});
 assert.equal(payloadOf('grid-move',el({id:'p',x:'5'})),null);
 assert.ok(Number.isNaN((payloadOf('grid-move',el({x:'NaN',y:'1'})) as {x:number}).x));
 assert.deepEqual(payloadOf('grid-nudge',el({id:'p',dx:'-1',dy:'0'})),{id:'p',dx:-1,dy:0});
 assert.deepEqual(payloadOf('begin-lesson',el({id:'l',restart:'true'})),{id:'l',restart:true});
 assert.deepEqual(payloadOf('begin-lesson',el({id:'l',restart:'false'})),{id:'l'});
 assert.deepEqual(payloadOf('listen',el({say:'cat',lang:'en',slow:'true',speechKind:'dialogue'})),{say:'cat',lang:'en',slow:true,speechKind:'dialogue'});
 assert.equal(payloadOf('home',el({id:'x'})),undefined);
});

test('readCall: nieznana akcja i brak wymaganych danych dają null, reszta to krotka do kontrolera',()=>{
 assert.equal(readCall('nie-ma-takiej',el()),null);
 assert.equal(readCall('answer',el()),null);
 assert.deepEqual(readCall('home',el()),['home']);
 assert.deepEqual(readCall('answer',el({answer:'x'})),['answer',{answer:'x'}]);
});

// Widok i granica zdarzeń muszą się zgadzać: to, co zapisze `act()`, `payloadOf()` czyta z powrotem.
const attrs=(html:string)=>Object.fromEntries([...html.matchAll(/data-([a-z-]+)="([^"]*)"/g)].map(([,key,value])=>[key.replace(/-(.)/g,(_,c:string)=>c.toUpperCase()),value.replace(/&quot;/g,'"').replace(/&amp;/g,'&')]));
test('act() zapisuje payload tak, że payloadOf() odczytuje ten sam obiekt',()=>{
 const html=act('grid-move',{id:'p"q',x:5,y:12,room:'salon',course:'c',owner:'guest'});
 assert.equal(attrs(html).action,'grid-move');
 assert.deepEqual(payloadOf('grid-move',el(attrs(html))),{id:'p"q',x:5,y:12,room:'salon',course:'c',owner:'guest'});
 assert.equal(act('begin-lesson',{id:'l',restart:true}),'data-action="begin-lesson" data-id="l" data-restart="true"');
 assert.equal(act('begin-lesson',{id:'l'}),'data-action="begin-lesson" data-id="l"');
 assert.equal(act('place-decoration',{id:'p',slot:''}),'data-action="place-decoration" data-id="p" data-slot=""');
 assert.equal(act('reading-peek',{sentence:'s',word:undefined}),'data-action="reading-peek" data-sentence="s"');
 assert.equal(act('listen',{say:'a',lang:'en',speechKind:'dialogue'}),'data-action="listen" data-say="a" data-lang="en" data-speech-kind="dialogue"');
 assert.equal(act('home'),'data-action="home"');
});
