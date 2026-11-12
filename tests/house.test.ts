import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {foodModules as modules} from './materials.ts';
import {emptyProgress,backup,validateBackup,next,recordAnswer,questionFor} from '../src/core.ts';
import {freshAdventure,lessons,validateJourney,makeLessonSession,rewardCompletion} from '../src/adventure.ts';
import {settleStageRewards} from '../src/stage-review.ts';
import {homeFor,stars,creditStars,purchase,place,settleHouseUnlocks,roomAvailable,itemAvailable} from '../src/house/progress.ts';
import {decorations} from '../src/house/catalog.ts';
const maps=['sciezka','sciezka-praktyka'].map(file=>validateJourney(JSON.parse(readFileSync(new URL(`../public/content/02-food/${file}.json`,import.meta.url),'utf8')),modules[0]));
const at='2026-11-10T12:00:00Z';
function complete(p:ReturnType<typeof emptyProgress>,j=maps[0]){p.adventure??=freshAdventure();for(const l of lessons(j))p.adventure.completed[l.key]={at};}

test('stary portfel i zakupy pozostają tylko w angielskim; odczyt kopii nie przenosi ani nie dubluje salda',()=>{
 const p=emptyProgress();creditStars(p,100);assert.ok(purchase(p,'pillow'));assert.ok(place(p,'pillow','right'));
 const old=structuredClone(p);for(let n=0;n<3;n++){
  const restored=validateBackup(backup(p)).progress;settleHouseUnlocks(restored,modules,maps);
  assert.deepEqual(restored,old);assert.equal(stars(restored),94);assert.equal(stars(restored,'french-book'),0);
 }
 creditStars(p,20,'french-book');assert.ok(purchase(p,'pillow','french-book'));
 assert.equal(stars(p),94);assert.equal(stars(p,'french-book'),14);
 assert.equal(homeFor(p)!.purchases.pillow.slot,'right');assert.equal(homeFor(p,'french-book')!.purchases.pillow.slot,'rug');
 assert.deepEqual(validateBackup(backup(p)).progress,p);assert.equal(stars(emptyProgress()),0);
});

test('nagrody lekcji, pełnej powtórki, dodatkowego treningu i etapu trafiają do kursu źródłowego',()=>{
 const m={...modules[0],id:'fr-unit',courseId:'french-book'},j={...maps[0],moduleId:m.id},p=emptyProgress();
 for(const expected of [3,1]){
  p.active=makeLessonSession([m],j,j.stages[0].lessons[0],'text',p);const s=p.active;
  while(p.active){recordAnswer(p,questionFor([m],s.items[s.index]),'wrong');next(p);}
  assert.equal(rewardCompletion(p,s,[m]),expected);assert.equal(rewardCompletion(p,s,[m]),0);
 }
 assert.equal(stars(p,'french-book'),4);assert.equal(stars(p),0);
 const extra={...structuredClone(p.sessions.at(-1)!),id:'extra',mode:'training' as const,lesson:undefined,lessonRewarded:undefined,training:{kind:'extra' as const}};
 p.sessions.push(extra);assert.equal(rewardCompletion(p,extra,[m]),1);assert.equal(rewardCompletion(p,extra,[m]),0);
 for(const l of lessons(j).filter(l=>l.stage.id===j.stages[0].id))p.adventure!.completed[l.key]={at};
 assert.equal(settleStageRewards(p,[j],at,[m]),3);assert.equal(stars(p,'french-book'),8);assert.equal(stars(p),0);
});

test('każda mapa odblokowuje wyposażenie, obie mapy pokój; błędy nie blokują i nic się nie dubluje',()=>{
 for(const order of [maps,[...maps].reverse()]){
  const p=emptyProgress();complete(p,order[0]);
  assert.deepEqual(settleHouseUnlocks(p,modules,maps),[]);assert.equal(roomAvailable(p,'angielski-hani','kitchen'),false);
  assert.equal(homeFor(p)!.unlockedItems!.length,4);p.difficult=['unit-2-food@1:word:apple'];
  complete(p,order[1]);assert.deepEqual(settleHouseUnlocks(p,modules,maps),['Kocia kuchnia']);
  assert.equal(homeFor(p)!.unlockedItems!.length,8);assert.equal(homeFor(p)!.rooms!.length,1);
  const saved=structuredClone(p);assert.deepEqual(settleHouseUnlocks(p,modules,maps),[]);assert.deepEqual(p,saved);
  assert.deepEqual(validateBackup(backup(p)).progress,p);assert.equal(stars(p),0);
  assert.equal(roomAvailable(p,'french-book','kitchen'),false);
 }
});

test('brak mapy lub błąd wczytania nie daje pokoju; zdobytego pokoju aktualizacja nie odbiera',()=>{
 const p=emptyProgress();for(const map of maps)complete(p,map);
 settleHouseUnlocks(p,modules,[maps[0]]);assert.equal(homeFor(p)?.rooms,undefined);
 settleHouseUnlocks(p,modules,maps,[{moduleId:'unit-2-food',path:'bad'}]);assert.equal(homeFor(p)?.rooms,undefined);
 settleHouseUnlocks(p,modules,maps);const saved=structuredClone(p);
 settleHouseUnlocks(p,modules,[],[{moduleId:'unit-2-food',path:'bad'}]);assert.deepEqual(p,saved);
});

test('kupowanie wymaga odblokowania, zgodnego pokoju i salda; przeniesienie nie kopiuje i nie pobiera opłaty',()=>{
 const p=emptyProgress();creditStars(p,100);assert.equal(purchase(p,'bowls'),false);assert.equal(purchase(p,'cat-toaster','angielski-hani','kitchen'),false);
 complete(p);settleHouseUnlocks(p,modules,maps);assert.ok(purchase(p,'bowls'));assert.equal(stars(p),94);
 assert.equal(place(p,'bowls','front','angielski-hani','kitchen'),false);
 complete(p,maps[1]);settleHouseUnlocks(p,modules,maps);assert.ok(purchase(p,'cat-toaster','angielski-hani','kitchen'));
 assert.ok(place(p,'bowls','front','angielski-hani','kitchen'));assert.equal(homeFor(p)!.purchases.bowls.room,'kitchen');
 assert.equal(stars(p),84);assert.equal(purchase(p,'bowls','angielski-hani','kitchen'),false);
 assert.equal(place(p,'cat-toaster','front','angielski-hani','salon'),false);
 assert.ok(place(p,'bowls','window','angielski-hani','kitchen'));assert.equal(homeFor(p)!.purchases['cat-toaster'].slot,null);
 assert.ok(place(p,'bowls',null));assert.equal(homeFor(p)!.purchases.bowls.room,undefined);
 assert.deepEqual(validateBackup(backup(p)).progress,p);
 creditStars(p,5,'french-book');assert.equal(purchase(p,'pillow','french-book'),false);assert.equal(stars(p),84);
});

test('kopie sprawdzają każdy portfel, pokój i zajętość miejsc; grafiki i katalog są kompletne',()=>{
 const p=emptyProgress();creditStars(p,100);complete(p);complete(p,maps[1]);settleHouseUnlocks(p,modules,maps);
 assert.ok(purchase(p,'bowls'));assert.ok(purchase(p,'cat-toaster','angielski-hani','kitchen'));creditStars(p,5,'french-book');
 const invalid=[
  (v:any)=>v.adventure.courseHomes['french-book'].purchases={pillow:{cost:6,slot:'rug'}},
  (v:any)=>v.adventure.courseHomes['angielski-hani']={earned:100,purchases:{}},
  (v:any)=>v.adventure.purchases.bowls.room='bathroom',
  (v:any)=>v.adventure.rooms=['kitchen','kitchen'],
  (v:any)=>v.adventure.unlockedItems=['__proto__'],
 ];
 for(const change of invalid){const b=backup(p);change(b.progress);assert.throws(()=>validateBackup(b));}
 for(const d of decorations){const svg=readFileSync(new URL(`../public/game/${d.id}.svg`,import.meta.url),'utf8');assert.match(svg,/<svg/);assert.ok(!svg.includes('<script'));}
 assert.ok(readFileSync(new URL('../public/game/kitchen.svg',import.meta.url)).length<5000);
 assert.ok(itemAvailable(p,'angielski-hani','bowls'));
});
