import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyProgress,type Progress} from '../src/core.ts';
import {creditStars,stars,homeFor} from '../src/house/progress.ts';
import {legacyCourse} from '../src/materials/identity.ts';
import {createHouseController,type HouseState} from '../src/controllers/house.ts';

// Kontroler domku dostaje zwykły obiekt z wąskim HouseState — bez AppState, DOM-u i prawdziwego zapisu.
const element=(dataset:Record<string,string>={})=>({dataset}) as HTMLElement;
function setup(over:Partial<HouseState>={}){
 const state:HouseState={progress:emptyProgress(),notice:'',screen:'home',houseOverview:false,houseEditing:false,houseTab:'shop',chosenRoom:'salon',chosenDecoration:'pillow',user:null,...over};
 creditStars(state.progress,20,legacyCourse);
 let course=legacyCourse,saves=0,fail=false;
 const mutate=async(change:(p:Progress)=>void)=>{const draft=structuredClone(state.progress);change(draft);if(fail)throw Error('Zapis niedostępny');state.progress=draft;saves++;};
 const controller=createHouseController(state,{mutate,courseId:()=>course});
 return {state,controller,saves:()=>saves,fail:()=>{fail=true;},useCourse:(id:string)=>{course=id;}};
}

test('wejście do domku i wybór pokoju zmieniają tylko stan ekranu, bez zapisu',async()=>{
 const f=setup({houseEditing:true});
 assert.equal(await f.controller.handleAction('house',element()),true);
 assert.deepEqual([f.state.screen,f.state.houseOverview,f.state.houseEditing],['house',true,false]);
 f.state.progress.adventure!.rooms=['kitchen'];
 await f.controller.handleAction('select-room',element({id:'kitchen'}));
 assert.deepEqual([f.state.houseOverview,f.state.chosenRoom,f.state.chosenDecoration,f.state.houseTab],[false,'kitchen','cat-toaster','shop']);
 await f.controller.handleAction('select-room',element({id:'garden'}));
 assert.equal(f.state.chosenRoom,'kitchen');assert.equal(f.saves(),0);
});

test('zakup zapisuje przez mutate i odejmuje gwiazdki wybranego kursu; odmowa podaje komunikat',async()=>{
 const f=setup();
 await f.controller.handleAction('buy-decoration',element({id:'pillow'}));
 assert.match(f.state.notice,/Nowa dekoracja/);assert.equal(stars(f.state.progress,legacyCourse),14);
 await f.controller.handleAction('buy-decoration',element({id:'pillow'}));
 assert.match(f.state.notice,/już Twój/);assert.equal(f.saves(),2);
 f.useCourse('french-book');
 await f.controller.handleAction('buy-decoration',element({id:'pillow'}));
 assert.match(f.state.notice,/już Twój|potrzeba/);assert.equal(stars(f.state.progress,legacyCourse),14);
});

test('ustawienie i ruch po siatce: tylko w edycji, dla swojego konta; błąd zapisu nie zmienia stanu',async()=>{
 const f=setup();await f.controller.handleAction('buy-decoration',element({id:'pillow'}));
 await f.controller.handleAction('place-decoration',element({id:'pillow',slot:'window'}));
 assert.equal(homeFor(f.state.progress,legacyCourse)!.purchases.pillow.slot,'window');
 const before=structuredClone(f.state.progress),count=f.saves();
 await f.controller.handleAction('grid-move',element({id:'pillow',x:'5',y:'12'}));
 assert.deepEqual(f.state.progress,before);
 await f.controller.handleAction('house-edit',element());assert.equal(f.state.houseEditing,true);
 await f.controller.handleAction('grid-move',element({id:'pillow',x:'5',y:'12',owner:'inne-konto'}));
 assert.equal(f.saves(),count);
 await f.controller.handleAction('grid-move',element({id:'pillow',x:'5',y:'12'}));
 assert.deepEqual(homeFor(f.state.progress,legacyCourse)!.purchases.pillow.position,{x:5,y:12});
 const saved=structuredClone(f.state.progress);f.state.notice='Przed zapisem';f.fail();
 await assert.rejects(f.controller.handleAction('grid-move',element({id:'pillow',x:'6',y:'12'})),/Zapis niedostępny/);
 assert.deepEqual(f.state.progress,saved);assert.equal(f.state.notice,'Przed zapisem');
});

test('zakładki domku przyjmują tylko sklep i schowek; cudze akcje przechodzą dalej',async()=>{
 const f=setup();
 await f.controller.handleAction('house-tab',element({tab:'storage'}));await f.controller.handleAction('house-tab',element({tab:'x'}));
 assert.equal(f.state.houseTab,'storage');
 assert.equal(await f.controller.handleAction('answer',element()),false);
});
