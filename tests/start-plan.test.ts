// Planery startu sesji to czyste funkcje: wynik zależy tylko od danych, nic nie jest zmieniane.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readingModule,readingJourney,readingQuestionIds} from './fixtures/readings.ts';
import {emptyProgress,questionFor,recordAnswer} from '../src/core.ts';
import {makeLessonSession,validateJourney} from '../src/adventure.ts';
import {varyLesson} from '../src/learning/lesson-variety.ts';
import {planReadingStart,type StartInput} from '../src/learning/start-plan.ts';

const m=readingModule(),modules=[m],j=validateJourney(readingJourney(),m),lesson=j.stages[0].lessons[1];
const input=(over:Partial<StartInput>={}):StartInput=>({courseModules:[m],modules,selectedModuleId:m.id,progress:emptyProgress(),...over});

test('czytanka, której nie poznano na mapie, daje komunikat i nie zmienia danych',()=>{
 const before=structuredClone(input());
 assert.equal(planReadingStart(input(),{id:'picnic'}).kind,'notice');
 assert.deepEqual(input(),before);
});

test('nieznany moduł lub brak identyfikatora daje komunikat',()=>{
 assert.equal(planReadingStart(input(),{module:'inny',id:'picnic'}).kind,'notice');
 assert.equal(planReadingStart(input({courseModules:[]}),{id:'picnic'}).kind,'notice');
 assert.equal(planReadingStart(input(),{}).kind,'notice');
});

test('poznana czytanka daje plan otwarcia: pytanie o zastąpienie, wybór modułu, tryb, bez zerowania nagród',()=>{
 const p=emptyProgress();
 p.active=varyLesson(makeLessonSession(modules,j,lesson,'mixed',p),modules,[j],j,lesson,p);
 const item=p.active.items[p.active.index];
 recordAnswer(p,questionFor(modules,item),questionFor(modules,item).answers[0]);
 const plan=planReadingStart(input({progress:p}),{id:'picnic'});
 assert.equal(plan.kind,'open');
 if(plan.kind!=='open')return;
 assert.equal(plan.session.mode,'reading');
 assert.deepEqual(plan.session.items.map(i=>i.id),readingQuestionIds());
 assert.equal(plan.select,m);assert.equal(plan.mode,'reading');assert.equal(plan.resetRewards,false);assert.ok(plan.confirm);
});
