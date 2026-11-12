import {test} from 'node:test';
import assert from 'node:assert/strict';
import {backup,emptyProgress,validateBackup,makeSession} from '../src/core.ts';
import {creditStars,homeFor,purchase,moveOnGrid,place,stars} from '../src/house/progress.ts';
import {sizeFor,boxFor,placementError} from '../src/house/layout.ts';
import {slots} from '../src/house/catalog.ts';
import {engineModules} from './fixtures/engine.ts';
const course='angielski-hani';
function setup(ids=['pillow']){
 const p=emptyProgress();creditStars(p,200);const h=homeFor(p)!;h.rooms=['kitchen'];h.unlockedItems=['fruit-bowl','table','bowls','picnic-blanket'];
 for(const id of ids){assert.ok(purchase(p,id,course,id==='table'?'kitchen':'salon'));h.purchases[id].slot=null;}
 return {p,h};
}
test('rozmiar przedmiotu jest niezależny od miejsca, pokoju i odczyt nie przepisuje starego wystroju',()=>{
 const {p,h}=setup();for(const slot of slots){h.purchases.pillow.slot=slot.id;const before=structuredClone(p);
  const b=boxFor(h,'pillow','salon');assert.deepEqual({w:b.w,h:b.h},sizeFor('pillow'));assert.deepEqual(p,before);
 }
});
test('ruch siatki zachowuje saldo, aktywną sesję, własność i kopię wersji 1',()=>{
 const {p,h}=setup();p.active=makeSession(engineModules,engineModules[0],'quiz','text',false,p);
 const active=structuredClone(p.active),balance=stars(p);
 assert.ok(moveOnGrid(p,'pillow',{x:2,y:12}));assert.ok(moveOnGrid(p,'pillow',{x:7,y:10}));
 assert.deepEqual(h.purchases.pillow,{cost:6,slot:null,position:{x:7,y:10}});
 assert.equal(stars(p),balance);assert.deepEqual(p.active,active);assert.deepEqual(validateBackup(backup(p)).progress,p);
 assert.ok(place(p,'pillow',null));assert.equal(h.purchases.pillow.position,undefined);
});
test('nieprawidłowe upuszczenie i kolizja tej samej warstwy nie zmieniają żadnego zapisu',()=>{
 const {p}=setup(['scratcher','basket']);assert.ok(moveOnGrid(p,'scratcher',{x:1,y:6}));
 for(const at of [{x:1,y:11},{x:-1,y:10},{x:23,y:10},{x:3,y:1},{x:3.5,y:11},{x:NaN,y:11}]){
  const before=structuredClone(p);assert.equal(moveOnGrid(p,'basket',at),false);assert.deepEqual(p,before);
 }
 assert.ok(moveOnGrid(p,'basket',{x:17,y:12}));
});
test('tekstylia mogą być pod meblem, a drobiazgi trafiają na pasujące powierzchnie',()=>{
 const {p,h}=setup(['picnic-blanket','basket','yarn']);
 assert.ok(moveOnGrid(p,'picnic-blanket',{x:8,y:11}));assert.ok(moveOnGrid(p,'basket',{x:9,y:12}));
 assert.ok(moveOnGrid(p,'yarn',{x:12,y:1}));assert.ok(placementError(h,'yarn',{x:12,y:6},'salon'));
});
test('przynależność do pokoju nie pozwala na przenoszenie; dawne zakupy w kuchni pozostają czytelne',()=>{
 const {p,h}=setup(['bowls']);h.purchases.bowls.room='kitchen';h.purchases.bowls.slot='front';
 const old=backup(p);assert.deepEqual(validateBackup(old),old);
 assert.equal(moveOnGrid(p,'bowls',{x:1,y:12},course,'salon'),false);
 assert.ok(moveOnGrid(p,'bowls',{x:17,y:5},course,'kitchen'));
 assert.equal(h.purchases.bowls.room,'kitchen');assert.equal(purchase(p,'pillow',course,'kitchen'),false);
});
test('drobiazgi na przesuwanym lub chowanym stoliku wracają do schowka',()=>{
 for(const hide of [false,true]){
  const {p,h}=setup(['table','fruit-bowl']);h.purchases['fruit-bowl'].room='kitchen';
  assert.ok(moveOnGrid(p,'table',{x:9,y:8},course,'kitchen'));
  assert.ok(moveOnGrid(p,'fruit-bowl',{x:10,y:9},course,'kitchen'));
  assert.ok(moveOnGrid(p,'table',{x:9,y:8},course,'kitchen'));
  assert.deepEqual(h.purchases['fruit-bowl'].position,{x:10,y:9});
  const balance=stars(p);
  assert.ok(hide?place(p,'table',null,course,'kitchen'):moveOnGrid(p,'table',{x:1,y:10},course,'kitchen'));
  assert.equal(h.purchases['fruit-bowl'].position,undefined);assert.equal(h.purchases['fruit-bowl'].slot,null);assert.equal(stars(p),balance);
 }
});
test('walidacja kopii odrzuca współrzędne poza pokojem i duplikaty w tej samej warstwie',()=>{
 const {p,h}=setup(['pillow','picnic-blanket']);assert.ok(moveOnGrid(p,'pillow',{x:2,y:12}));
 for(const position of [{x:-1,y:1},{x:23,y:14},{x:1.5,y:12},{x:1,y:Infinity}]){
  const b=backup(p);b.progress.adventure!.purchases.pillow.position=position;assert.throws(()=>validateBackup(b));
 }
 h.purchases['picnic-blanket'].position={x:2,y:12};assert.throws(()=>validateBackup(backup(p)));
});
