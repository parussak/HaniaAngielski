import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AppState} from '../src/app/state.ts';
import {createHouseController} from '../src/controllers/house.ts';
import {createLearningController} from '../src/controllers/learning.ts';
import {creditStars,stars,homeFor} from '../src/house/progress.ts';
import {legacyCourse} from '../src/materials/identity.ts';
import {engineModule} from './fixtures/engine.ts';
import {courseFixture} from './fixtures/course-materials.ts';
import {backup,validateBackup,makeSession,type Progress} from '../src/core.ts';
const element=(dataset:Record<string,string>={})=>({dataset}) as HTMLElement;
function setup(){
 const state=new AppState();state.modules=[engineModule('house-controller-unit',legacyCourse)];state.selected=state.modules[0];
 state.courses=courseFixture().courses;state.courses[0].id=legacyCourse;state.courses[0].moduleIds=[state.selected.id];state.selectedCourseId=legacyCourse;
 creditStars(state.progress,20);creditStars(state.progress,12,'french-book');
 state.progress.active=makeSession(state.modules,state.selected,'flashcards','text',false,state.progress);
 let saves=0,fail=false;
 const mutate=async(change:(p:Progress)=>void)=>{const draft=structuredClone(state.progress);change(draft);if(fail)throw Error('Zapis niedostępny');state.progress=draft;saves++;};
 return {state,controller:createHouseController(state,{mutate}),mutate,saves:()=>saves,fail:()=>{fail=true;}};
}

test('nawigacja domku i wybór dekoracji nie zmieniają aktywnej lekcji ani zapisu',async()=>{
 const {state,controller,saves}=setup(),before=JSON.stringify(state.progress);
 assert.ok(await controller.handleAction('house',element()));assert.equal(state.screen,'house');
 await controller.handleAction('select-decoration',element({id:'yarn'}));assert.equal(state.chosenDecoration,'yarn');
 await controller.handleAction('select-room',element({id:'kitchen'}));assert.equal(state.chosenRoom,'salon');assert.equal(state.chosenDecoration,'yarn');
 state.progress.adventure!.rooms=['kitchen'];const withRoom=JSON.stringify(state.progress);
 await controller.handleAction('select-room',element({id:'kitchen'}));assert.equal(state.chosenRoom,'kitchen');assert.equal(state.chosenDecoration,'cat-toaster');
 assert.equal(JSON.stringify(state.progress),withRoom);assert.equal(saves(),0);
 delete state.progress.adventure!.rooms;assert.equal(JSON.stringify(state.progress),before);
});

test('zakup, przestawienie i schowanie zachowują lekcję oraz osobne saldo kursów',async()=>{
 const {state,controller,saves}=setup(),active=structuredClone(state.progress.active);
 await controller.handleAction('buy-decoration',element({id:'pillow'}));assert.equal(stars(state.progress),14);assert.match(state.notice,/Nowa dekoracja/);
 await controller.handleAction('place-decoration',element({id:'pillow',slot:'window'}));assert.equal(homeFor(state.progress)!.purchases.pillow.slot,'window');
 await controller.handleAction('place-decoration',element({id:'pillow',slot:''}));assert.equal(homeFor(state.progress)!.purchases.pillow.slot,null);
 assert.equal(stars(state.progress),14);assert.equal(stars(state.progress,'french-book'),12);
 state.selectedCourseId='french-book';await controller.handleAction('buy-decoration',element({id:'pillow'}));
 assert.equal(stars(state.progress,'french-book'),6);assert.equal(stars(state.progress),14);
 await controller.handleAction('buy-decoration',element({id:'pillow'}));assert.equal(stars(state.progress,'french-book'),6);assert.match(state.notice,/już Twój/);
 assert.equal(saves(),5);assert.deepEqual(state.progress.active,active);assert.deepEqual(validateBackup(backup(state.progress)).progress,state.progress);
});

test('błąd zapisu zakupu lub ustawienia nie zmienia postępów i nie ogłasza sukcesu',async()=>{
 for(const action of ['buy-decoration','place-decoration']){
  const f=setup();if(action==='place-decoration')await f.controller.handleAction('buy-decoration',element({id:'pillow'}));
  f.state.notice='Przed zapisem';const before=JSON.stringify(f.state.progress);f.fail();
  await assert.rejects(f.controller.handleAction(action,element({id:'pillow',slot:'right'})),/Zapis niedostępny/);
  assert.equal(JSON.stringify(f.state.progress),before);assert.equal(f.state.notice,'Przed zapisem');
 }
});

test('kontrolery przekazują nieswoje akcje dalej bez modyfikowania stanu',async()=>{
 const f=setup(),before=JSON.stringify(f.state.progress);
 for(const action of ['answer','next','mode','unknown'])assert.equal(await f.controller.handleAction(action,element()),false);
 const learning=createLearningController(f.state,{mutate:f.mutate,scheduleReviewMigration:()=>{},courses:{select:async()=>false,restore:async()=>{},followSession:async()=>{}}});
 for(const action of ['house','select-room','select-decoration','buy-decoration','place-decoration'])assert.equal(await learning.handleAction(action,element({id:'pillow'})),false);
 assert.equal(JSON.stringify(f.state.progress),before);assert.equal(f.saves(),0);
});

test('Moje rzeczy i sklep są lokalną nawigacją, a niewłaściwe ustawienie nie ogłasza sukcesu',async()=>{
 const f=setup(),before=structuredClone(f.state.progress);
 await f.controller.handleAction('house-tab',element({tab:'storage'}));assert.equal(f.state.houseTab,'storage');
 await f.controller.handleAction('house-tab',element({tab:'invalid'}));assert.equal(f.state.houseTab,'storage');
 await f.controller.handleAction('house-tab',element({tab:'shop'}));assert.equal(f.state.houseTab,'shop');
 assert.deepEqual(f.state.progress,before);assert.equal(f.saves(),0);
 await f.controller.handleAction('buy-decoration',element({id:'pillow'}));
 const purchased=structuredClone(f.state.progress);
 await f.controller.handleAction('place-decoration',element({id:'pillow',slot:'counter'}));
 assert.deepEqual(f.state.progress,purchased);assert.match(f.state.notice,/Nie można ustawić/);
});

test('schowanie na nowym miejscu podaje nazwę i zachowuje aktywną lekcję',async()=>{
 const f=setup();await f.controller.handleAction('buy-decoration',element({id:'pillow'}));
 await f.controller.handleAction('place-decoration',element({id:'pillow',slot:'floor-cushion'}));
 const active=structuredClone(f.state.progress.active),balance=stars(f.state.progress);
 await f.controller.handleAction('place-decoration',element({id:'pillow',slot:''}));
 assert.match(f.state.notice,/W schowku: Poduszka/);assert.equal(stars(f.state.progress),balance);
 assert.deepEqual(f.state.progress.active,active);
});

test('ruch siatki wymaga edycji, właściwego konta i pokoju; odmowa nie zapisuje postępów',async()=>{
 const f=setup();await f.controller.handleAction('buy-decoration',element({id:'pillow'}));
 const before=structuredClone(f.state.progress),count=f.saves();
 await f.controller.handleAction('grid-move',element({id:'pillow',x:'5',y:'12'}));assert.deepEqual(f.state.progress,before);
 await f.controller.handleAction('house-edit',element());assert.equal(f.state.houseEditing,true);
 for(const extra of [{course:'other'},{room:'kitchen'},{owner:'other-account'},{x:'NaN'}])await f.controller.handleAction('grid-move',element({id:'pillow',x:'5',y:'12',...extra}));
 assert.deepEqual(f.state.progress,before);assert.equal(f.saves(),count);
 await f.controller.handleAction('grid-move',element({id:'pillow',x:'5',y:'12'}));
 assert.deepEqual(homeFor(f.state.progress)!.purchases.pillow.position,{x:5,y:12});assert.equal(f.saves(),count+1);
});

test('błąd zapisu współrzędnych nie przesuwa przedmiotu ani nie ogłasza sukcesu',async()=>{
 const f=setup();await f.controller.handleAction('buy-decoration',element({id:'pillow'}));f.state.houseEditing=true;
 const before=structuredClone(f.state.progress);f.state.notice='Przed zapisem';f.fail();
 await assert.rejects(f.controller.handleAction('grid-move',element({id:'pillow',x:'5',y:'12'})),/Zapis niedostępny/);
 assert.deepEqual(f.state.progress,before);assert.equal(f.state.notice,'Przed zapisem');
});
