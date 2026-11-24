// Planery startu sesji to czyste funkcje: wynik zależy tylko od danych, nic nie jest zmieniane.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readingModule,readingJourney,readingQuestionIds} from './fixtures/readings.ts';
import {emptyProgress} from '../src/learning/model.ts';
import {questionFor} from '../src/learning/questions.ts';
import {recordAnswer} from '../src/learning/session.ts';
import {journeyKey} from '../src/learning/journey.ts';
import {makeLessonSession} from '../src/learning/lesson-session.ts';
import {validateJourney} from '../src/learning/journey-validation.ts';
import {varyLesson} from '../src/learning/lesson-variety.ts';
import {planBeginLesson,planLegendary,planLessonAfterFinished,planStageReviewAction} from '../src/learning/start-lesson-plans.ts';
import {planCourseMode,planExtraTraining,planGrammarPractice,planMode,planReadingStart,planRitual} from '../src/learning/start-practice-plans.ts';
import type {StartInput} from '../src/learning/start-plan.ts';

const m=readingModule(),modules=[m],j=validateJourney(readingJourney(),m),lesson=j.stages[0].lessons[1];
const input=(over:Partial<StartInput>={}):StartInput=>({courseModules:[m],modules,journeys:[j],journeyIssues:[],progress:emptyProgress(),answerMode:'mixed',previous:false,selected:m,currentJourney:j,lastSession:null,grammarTopicIds:new Set(),...over});

test('planery niczego nie zmieniają w danych wejściowych',()=>{
 const before=structuredClone(input());
 planReadingStart(input(),{id:'picnic'});planMode(input(),{mode:'quiz'});planBeginLesson(input(),{id:lesson.id});planCourseMode(input(),{mode:'quiz'});
 assert.deepEqual(input(),before);
});

test('czytanka, której nie poznano na mapie, daje komunikat',()=>{
 assert.equal(planReadingStart(input(),{id:'picnic'}).kind,'notice');
});

test('nieznany moduł lub brak identyfikatora czytanki daje komunikat',()=>{
 assert.equal(planReadingStart(input(),{module:'inny',id:'picnic'}).kind,'notice');
 assert.equal(planReadingStart(input({courseModules:[]}),{id:'picnic'}).kind,'notice');
 assert.equal(planReadingStart(input(),{}).kind,'notice');
});

test('poznana czytanka daje plan otwarcia: pytanie o zastąpienie, wybór modułu i trybu po zgodzie, bez zerowania nagród',()=>{
 const p=emptyProgress();
 p.active=varyLesson(makeLessonSession(modules,j,lesson,'mixed',p),modules,[j],j,lesson,p);
 const item=p.active.items[p.active.index];
 recordAnswer(p,questionFor(modules,item),questionFor(modules,item).answers[0]);
 const plan=planReadingStart(input({progress:p}),{id:'picnic'});
 assert.equal(plan.kind,'open');
 if(plan.kind!=='open')return;
 assert.equal(plan.session.mode,'reading');
 assert.deepEqual(plan.session.items.map(i=>i.id),readingQuestionIds());
 assert.deepEqual(plan.afterConfirm,{module:m,mode:'reading'});assert.equal(plan.selection,undefined);
 assert.equal(plan.resetRewards,false);assert.ok(plan.confirm);
});

test('lekcja z mapy: nieznana daje komunikat, znana otwiera sesję, wznowienie tej samej nie pyta o zastąpienie',()=>{
 assert.equal(planBeginLesson(input(),{id:'brak'}).kind,'notice');
 const plan=planBeginLesson(input(),{id:lesson.id});
 assert.equal(plan.kind,'open');
 if(plan.kind!=='open')return;
 assert.ok(plan.confirm);assert.equal(plan.resetRewards,true);
 const p=emptyProgress();p.active=plan.session;
 const again=planBeginLesson(input({progress:p}),{id:lesson.id,restart:true});
 assert.equal(again.kind==='open'&&again.confirm,null);
 const other=planBeginLesson(input({progress:p}),{id:lesson.id});
 assert.ok(other.kind==='open'&&other.confirm);
});

test('powtórka etapu: obca mapa jest ignorowana, brak etapu zachowuje wybór mapy',()=>{
 assert.deepEqual(planStageReviewAction(input({courseModules:[]}),{journey:journeyKey(j),id:j.stages[0].id}),{kind:'ignore'});
 const none=planStageReviewAction(input(),{journey:journeyKey(j),id:'brak'});
 assert.equal(none.kind,'ignore');assert.deepEqual(none.selection,{module:m,journeyKey:journeyKey(j)});
 assert.deepEqual(planStageReviewAction(input({currentJourney:undefined}),{id:'brak'}),{kind:'ignore',selection:undefined});
});

test('kolejna lekcja i poziom legendarny bez ukończonej lekcji nic nie robią',()=>{
 assert.deepEqual(planLessonAfterFinished(input(),'following-lesson'),{kind:'none'});
 assert.deepEqual(planLegendary(input()),{kind:'ignore'});
});

test('tryb zwykły: obcy moduł jest ignorowany, brak zadań zapamiętuje tryb i daje komunikat',()=>{
 assert.deepEqual(planMode(input(),{module:'inny',mode:'quiz'}),{kind:'ignore'});
 const plan=planMode(input({progress:emptyProgress()}),{mode:'dialogue'});
 if(plan.kind==='notice')assert.deepEqual(plan.selection,{mode:'dialogue'});
 else{assert.equal(plan.kind,'open');assert.equal(plan.kind==='open'&&plan.resetRewards,false);}
});

test('tryby kursu, gramatyka, rytuał i rozgrzewka ignorują niepoprawne dane',()=>{
 assert.deepEqual(planCourseMode(input(),{mode:'dialogue'}),{kind:'ignore'});
 assert.deepEqual(planCourseMode(input({courseModules:[]}),{mode:'quiz'}),{kind:'ignore'});
 assert.equal(planGrammarPractice(input(),{id:'nieznany'}).kind,'notice');
 assert.deepEqual(planGrammarPractice(input({courseModules:[]}),{id:'x'}),{kind:'ignore'});
 assert.deepEqual(planRitual(input(),{module:m.id,kind:'inny'}),{kind:'ignore'});
 assert.deepEqual(planRitual(input(),{module:'brak',kind:'opening'}),{kind:'ignore'});
 assert.deepEqual(planExtraTraining(input({courseModules:[]}),{}),{kind:'ignore'});
});

test('finałowa misja czeka na wszystkie mapy modułu',()=>{
 const plan=planRitual(input({journeyIssues:[{moduleId:m.id,path:'map.json'}]}),{module:m.id,kind:'finale'});
 assert.equal(plan.kind,'notice');
});
