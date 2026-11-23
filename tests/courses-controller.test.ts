// Kontroler kursów widzi tylko wąski CourseState (najwęższy dostęp do stanu) — bez AppState i bez DOM-u.
// Odczyt i zapis preferencji to jawne porty; `progress` jest tylko czytany.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCourseController,coursePreferenceKey,type CourseState} from '../src/controllers/courses.ts';
import {emptyProgress,makeSession} from '../src/core.ts';
import {readLibrary} from '../src/materials/library.ts';
import {courseFixture} from './fixtures/course-materials.ts';

async function setup(opts:{failWrite?:boolean}={}){
 const library=await readLibrary(courseFixture().read),records=new Map<string,unknown>();
 const state:CourseState={
  courses:library.courses,modules:library.modules,journeys:[],progress:emptyProgress(),user:null,
  selectedCourseId:'',selected:library.modules[0],selectedJourneyKey:'',introLessonId:'lekcja',
  houseOverview:false,chosenRoom:'kuchnia',chosenDecoration:'lampa',notice:'',
 };
 const controller=createCourseController(state,{
  read:async key=>records.get(key),
  write:async(key,value)=>{if(opts.failWrite)throw new Error('brak miejsca');records.set(key,value);},
 });
 return {state,controller,records,library};
}

test('wybór kursu zapamiętuje preferencję i przywraca ekran domku oraz mapy do stanu wyjściowego',async()=>{
 const {state,controller,records}=await setup();
 assert.equal(await controller.select('french-book'),true);
 assert.equal(state.selectedCourseId,'french-book');assert.equal(state.selected?.courseId,'french-book');
 assert.deepEqual(records.get(coursePreferenceKey()),{version:1,courseId:'french-book'});
 assert.equal(state.introLessonId,'');assert.equal(state.houseOverview,true);
 assert.equal(state.chosenRoom,'salon');assert.equal(state.chosenDecoration,'pillow');assert.equal(state.selectedJourneyKey,'');
});

test('wybór nieznanego kursu niczego nie zmienia ani nie zapisuje',async()=>{
 const {state,controller,records}=await setup();
 assert.equal(await controller.select('nie-ma'),false);
 assert.equal(state.selectedCourseId,'');assert.equal(records.size,0);assert.equal(state.introLessonId,'lekcja');
});

test('niepowodzenie zapisu preferencji zostawia komunikat, ale kurs jest wybrany na tę wizytę',async()=>{
 const {state,controller}=await setup({failWrite:true});
 assert.equal(await controller.select('french-book'),true);
 assert.equal(state.selectedCourseId,'french-book');assert.match(state.notice,/Nie udało się zapamiętać wyboru/);
});

test('przywracanie bez zapisanej preferencji wybiera kurs aktywnej sesji',async()=>{
 const {state,controller,library}=await setup();
 const french=library.modules.find(m=>m.courseId==='french-book')!;
 const progress=emptyProgress();progress.active=makeSession(library.modules,french,'quiz','text',false,progress);
 Object.assign(state,{progress});
 await controller.restore();
 assert.equal(state.selectedCourseId,'french-book');
});

test('przywracanie przy braku modułów czyści wybór kursu',async()=>{
 const {state,controller}=await setup();
 Object.assign(state,{modules:[],selectedCourseId:'english-book'});
 await controller.restore();
 assert.equal(state.selectedCourseId,'');
});

test('preferencja gościa i konta są osobne',async()=>{
 const {state,controller,records}=await setup();
 await controller.select('french-book');
 Object.assign(state,{user:{uid:'tester',email:'t@example.test',displayName:null}});
 await controller.select('italian-book');
 assert.deepEqual(records.get(coursePreferenceKey('tester')),{version:1,courseId:'italian-book'});
 assert.deepEqual(records.get(coursePreferenceKey()),{version:1,courseId:'french-book'});
});

test('kontynuacja sesji przełącza na kurs aktywnej sesji i ustawia jej moduł',async()=>{
 const {state,controller,library}=await setup();
 await controller.select('french-book');
 const english=library.modules.find(m=>m.courseId==='english-book')!;
 const progress=emptyProgress();progress.active=makeSession(library.modules,english,'quiz','text',false,progress);
 Object.assign(state,{progress});
 await controller.followSession();
 assert.equal(state.selectedCourseId,'english-book');assert.equal(state.selected?.id,english.id);
});
