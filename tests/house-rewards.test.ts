import {test} from 'node:test';
import assert from 'node:assert/strict';
import {engineModule} from './fixtures/engine.ts';
import {validateModules} from '../src/content-validation.ts';
import {emptyProgress,type Module} from '../src/core.ts';
import {freshAdventure,lessons,validateJourney,type Journey} from '../src/adventure.ts';
import {homeFor,settleHouseUnlocks,roomAvailable,itemAvailable} from '../src/house/progress.ts';
import {decorationMaps,houseRewardProblems,moduleRooms} from '../src/house/rewards.ts';

// D-67: nagrody domku przypisuje treść kursu, nie kod. Dane syntetyczne, bez Food.
const course='reward-course',at='2026-11-18T12:00:00Z';
const base=engineModule('reward-unit',course);
const unit:Module={...base,journeyPaths:['reward/a.json','reward/b.json'],houseRoom:'kitchen'};
function journey(m:Module,id:string|undefined,rewards?:unknown):Journey{
 return validateJourney({version:1,moduleId:m.id,...(id?{id}:{}),title:`Mapa ${id??'główna'}`,...(rewards?{rewards}:{}),stages:[{id:'stage',title:'Etap',cat:'albert',illustration:'illustrations/test.svg',lessons:[{id:'lesson',title:'Lekcja',intro:'Wstęp',wordIds:m.words.slice(0,6).map(w=>w.id),exerciseIds:[],ruleIds:[]}]}]},m);
}
const first=journey(unit,undefined,{decorations:['lemonade','bowls'],badge:'Odznaka testowa'});
const second=journey(unit,'druga',{decorations:['table']});
function complete(p:ReturnType<typeof emptyProgress>,j:Journey){p.adventure??=freshAdventure();for(const l of lessons(j))p.adventure.completed[l.key]={at};}

test('mapa odblokowuje przedmioty wymienione w swoim pliku, a wszystkie mapy modułu — pokój z modul.json',()=>{
 const p=emptyProgress();complete(p,first);
 assert.deepEqual(settleHouseUnlocks(p,[unit],[first,second]),[]);
 assert.deepEqual(homeFor(p,course)!.unlockedItems,['lemonade','bowls']);
 assert.equal(itemAvailable(p,course,'table'),false);assert.equal(roomAvailable(p,course,'kitchen'),false);
 complete(p,second);
 assert.deepEqual(settleHouseUnlocks(p,[unit],[first,second]),['Kocia kuchnia']);
 assert.deepEqual(homeFor(p,course)!.unlockedItems,['lemonade','bowls','table']);assert.deepEqual(homeFor(p,course)!.rooms,['kitchen']);
 const saved=structuredClone(p);assert.deepEqual(settleHouseUnlocks(p,[unit],[first,second]),[]);assert.deepEqual(p,saved);
});

test('bez houseRoom, bez wczytanej mapy lub przy uszkodzonej mapie moduł nie daje pokoju',()=>{
 const cases:[Module[],Journey[],{moduleId:string;path:string}[]][]=[
  [[{...unit,houseRoom:undefined}],[first,second],[]],
  [[unit],[first],[]],
  [[unit],[first,second],[{moduleId:unit.id,path:'reward/c.json'}]],
 ];
 for(const [modules,journeys,issues] of cases){
  const p=emptyProgress();complete(p,first);complete(p,second);
  assert.deepEqual(settleHouseUnlocks(p,modules,journeys,issues),[]);assert.equal(roomAvailable(p,course,'kitchen'),false);
 }
});

test('przedmiot-nagroda bez przypisania w kursie nie jest do kupienia, a raz zdobyty zostaje po zmianie treści',()=>{
 const p=emptyProgress();
 assert.equal(itemAvailable(p,course,'mugs'),false);assert.equal(itemAvailable(p,course,'pillow'),true);
 complete(p,first);settleHouseUnlocks(p,[unit],[first,second]);
 const changed={...first,rewards:{decorations:['mugs']}};
 settleHouseUnlocks(p,[unit],[changed,second]);
 assert.equal(itemAvailable(p,course,'lemonade'),true);assert.equal(itemAvailable(p,course,'mugs'),true);
 assert.deepEqual([...decorationMaps([unit],[changed,second],course).keys()],['mugs','table']);
 assert.deepEqual(decorationMaps([unit],[first],'other-course').size,0);
 assert.deepEqual(moduleRooms([unit,base],course).map(r=>[r.room.id,r.module.id]),[['kitchen',unit.id]]);
});

test('mapa przyjmuje tylko istniejące przedmioty-nagrody bez powtórzeń i niepustą odznakę',()=>{
 for(const rewards of [{decorations:['pillow']},{decorations:['unknown']},{decorations:['bowls','bowls']},{decorations:[]},{badge:' '},{badge:3},{decorations:['bowls'],rooms:['kitchen']},['bowls']])
  assert.throws(()=>journey(unit,'zla',rewards),/Niepoprawna mapa/,JSON.stringify(rewards));
 assert.deepEqual(journey(unit,'dobra',{badge:'Odznaka'}).rewards,{badge:'Odznaka'});
});

test('moduł wskazuje tylko pokój z katalogu (nie salonik) i musi mieć mapy',()=>{
 const {journeyPaths:_paths,houseRoom:_room,...plain}=unit;
 for(const m of [{...unit,houseRoom:'salon'},{...unit,houseRoom:'attic'},{...plain,houseRoom:'kitchen'}])
  assert.throws(()=>validateModules([m]),/pokój za moduł/);
 assert.equal(validateModules([unit])[0].houseRoom,'kitchen');
});

test('kontrola treści wykrywa przedmiot dwóch map i pokój dwóch modułów jednego kursu',()=>{
 const other:Module={...engineModule('reward-other',course,3),journeyPaths:['reward/o.json'],houseRoom:'kitchen'};
 const third=journey(other,undefined,{decorations:['bowls']});
 assert.equal(houseRewardProblems([unit,other],[first,second,third]).length,2);
 const elsewhere:Module={...other,courseId:'other-course'};
 assert.deepEqual(houseRewardProblems([unit,elsewhere],[first,second,{...third}]),[]);
});
