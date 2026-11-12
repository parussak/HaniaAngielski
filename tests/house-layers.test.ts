import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyProgress,backup,validateBackup,makeSession} from '../src/core.ts';
import {decorations,decorationLayer,canUseSlot} from '../src/house/catalog.ts';
import {homeFor,creditStars,purchase,place,stars} from '../src/house/progress.ts';
import {engineModules} from './fixtures/engine.ts';
const course='angielski-hani';
const foodDecorations=decorations.filter(d=>!d.map||d.map.split('/')[0]==='unit-2-food');
function furnished(){
 const p=emptyProgress();creditStars(p,250);
 const h=homeFor(p)!;h.rooms=['kitchen'];h.unlockedItems=foodDecorations.map(d=>d.id);
 for(const d of foodDecorations)assert.ok(purchase(p,d.id,course,d.rooms[0]));
 p.active=makeSession(engineModules,engineModules[0],'quiz','text',false,p);
 return p;
}

test('całe wyposażenie saloniku mieści się na osobnych warstwach bez chowania zakupów',()=>{
 const p=furnished(),h=homeFor(p)!,active=structuredClone(p.active),balance=stars(p);
 const layout:Record<string,string>={pillow:'floor-cushion',yarn:'front',scratcher:'left',plant:'window',books:'shelf',basket:'right',bowls:'floor-side',lemonade:'shelf-left','picnic-basket':'rug','picnic-blanket':'floor-cover','fruit-bowl':'shelf-right'};
 for(const [id,slot] of Object.entries(layout))assert.ok(place(p,id,slot));
 for(const [id,slot] of Object.entries(layout))assert.equal(h.purchases[id].slot,slot,id);
 assert.equal(Object.keys(layout).length,foodDecorations.filter(d=>d.rooms.includes('salon')).length);
 assert.equal(decorationLayer('picnic-blanket'),'textiles');assert.equal(decorationLayer('table'),'furniture');assert.equal(decorationLayer('fruit-bowl'),'objects');
 assert.equal(stars(p),balance);assert.deepEqual(p.active,active);assert.deepEqual(validateBackup(backup(p)).progress,p);
});

test('drobiazgi na stoliku nie wypierają mebla; przeniesienie podpory chowa je bez utraty',()=>{
 const p=furnished(),h=homeFor(p)!,balance=stars(p);
 // Earlier versions allowed these purchases in the kitchen. Preserve that ownership.
 h.purchases['fruit-bowl'].room='kitchen';h.purchases.lemonade.room='kitchen';
 assert.ok(place(p,'table','rug',course,'kitchen'));
 assert.ok(place(p,'fruit-bowl','table-left',course,'kitchen'));
 assert.ok(place(p,'lemonade','table-right',course,'kitchen'));
 assert.equal(h.purchases.table.slot,'rug');
 assert.ok(place(p,'table','left',course,'kitchen'));
 assert.equal(h.purchases['fruit-bowl'].slot,null);assert.equal(h.purchases.lemonade.slot,null);
 assert.equal(place(p,'fruit-bowl','table-left',course,'kitchen'),false);
 assert.equal(stars(p),balance);assert.equal(Object.keys(h.purchases).length,foodDecorations.length);
});

test('nowe miejsca respektują warstwy i pokoje, stare dowolne ustawienia pozostają poprawne',()=>{
 const p=furnished();assert.ok(place(p,'pillow','window'));const old=backup(p);
 assert.deepEqual(validateBackup(old),old);
 assert.equal(canUseSlot('pillow','shelf-left','salon'),false);
 assert.equal(place(p,'pillow','shelf-left'),false);assert.equal(place(p,'lemonade','counter'),false);
 assert.equal(place(p,'pillow','unknown'),false);assert.ok(place(p,'pillow','floor-cushion'));
 const duplicate=backup(p);duplicate.progress.adventure!.purchases.yarn.slot='floor-cushion';
 assert.throws(()=>validateBackup(duplicate));
});

test('zastąpienie, schowek i odtworzenie nie zmieniają zakupów, salda ani drugiego kursu',()=>{
 const p=furnished(),h=homeFor(p)!;creditStars(p,25,'french-book');purchase(p,'pillow','french-book');
 const french=structuredClone(homeFor(p,'french-book')),costs=Object.fromEntries(Object.entries(h.purchases).map(([id,v])=>[id,v.cost]));
 const balance=stars(p);assert.ok(place(p,'plant','shelf-left'));assert.ok(place(p,'fruit-bowl','shelf-left'));
 assert.equal(h.purchases.plant.slot,null);assert.ok(place(p,'fruit-bowl',null));assert.ok(place(p,'plant','shelf-right'));
 const restored=validateBackup(backup(p)).progress;
 assert.equal(stars(restored),balance);assert.deepEqual(homeFor(restored,'french-book'),french);
 assert.deepEqual(Object.fromEntries(Object.entries(homeFor(restored)!.purchases).map(([id,v])=>[id,v.cost])),costs);
});
