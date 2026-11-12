import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {foodModules as modules} from './materials.ts';
import {emptyProgress,makeSession,keyFor,backup,validateBackup,type Progress} from '../src/core.ts';
import {freshAdventure,lessons,type Journey} from '../src/adventure.ts';
import {getNextStep} from '../src/next-step.ts';
import {stageKey} from '../src/stage-review.ts';
const m=modules[0],j:Journey=JSON.parse(readFileSync(new URL('../public/content/02-food/sciezka.json',import.meta.url),'utf8'));
const m2={...structuredClone(m),id:'unit-3-test',order:3,cover:'Test'},j2={...structuredClone(j),moduleId:m2.id};
const complete=(p:Progress,map:Journey,at='2026-11-09T12:00:00.000Z')=>{
  p.adventure??=freshAdventure();for(const l of lessons(map))p.adventure.completed[l.key]={at};
};
function pending(p:Progress){
  p.adventure??=freshAdventure();p.adventure.reviewSchema=1;
  const item={key:keyFor(m,'word','apple'),moduleId:m.id,version:1,type:'word' as const,id:'apple',input:'text' as const};
  p.adventure.stageReviews={[stageKey(j,j.stages[0])]:{round:0,items:{[item.key]:{item,correct:0,due:1}}}};
}

test('następny krok: nowe konto zaczyna od pierwszej lekcji bez zmiany postępów',()=>{
  const p=emptyProgress(),before=structuredClone(p),step=getNextStep([m],[j],p);
  assert.equal(step.kind,'lesson');if(step.kind!=='lesson')return;
  assert.equal(step.lessonId,j.stages[0].lessons[0].id);assert.equal(step.first,true);assert.equal(step.newModule,false);
  assert.deepEqual(p,before);
});
test('rozpoczęta lekcja, quiz i powtórka mają pierwszeństwo; dawnych materiałów nie zastępujemy',()=>{
  for(const mode of ['lesson','quiz','review'] as const){
    const p=emptyProgress();p.active=makeSession([m],m,'quiz','text',false,p);p.active.mode=mode;
    if(mode==='lesson')p.active.lesson={id:`${m.id}/${j.stages[0].lessons[0].id}`,title:'Rozpoczęta lekcja'};
    complete(p,j);const step=getNextStep([m,m2],[j,j2],p);assert.equal(step.kind,'resume');assert.equal(step.moduleId,m.id);
    p.active.items[0].version=99;assert.equal(getNextStep([m,m2],[j,j2],p).kind,'unavailable');
  }
});
test('ukończona lekcja prowadzi do następnej; kopia i ponowne uruchomienie zachowują wybór',()=>{
  const p=emptyProgress();p.adventure=freshAdventure();p.adventure.completed[lessons(j)[0].key]={at:'2026-11-09T12:00:00.000Z'};
  const restored=validateBackup(backup(p)).progress,step=getNextStep([m],[j],restored);
  assert.equal(step.kind,'lesson');if(step.kind==='lesson'){assert.equal(step.lessonId,lessons(j)[1].lesson.id);assert.equal(step.first,false);}
});
test('kolejny moduł jest wybierany według kolejności, mimo zaległych powtórek wcześniejszego',()=>{
  const p=emptyProgress();complete(p,j);pending(p);
  const step=getNextStep([m2,m],[j2,j],p);assert.equal(step.kind,'lesson');assert.equal(step.moduleId,m2.id);
  if(step.kind==='lesson'){assert.equal(step.newModule,true);assert.equal(step.lessonId,lessons(j2)[0].lesson.id);}
});
test('kontynuujemy ostatnio używany moduł, a po jego końcu wracamy też do pominiętych wcześniejszych lekcji',()=>{
  const p=emptyProgress();p.adventure=freshAdventure();p.adventure.completed[lessons(j2)[0].key]={at:'2026-11-09T12:00:00.000Z'};
  let step=getNextStep([m,m2],[j,j2],p);assert.equal(step.moduleId,m2.id);if(step.kind==='lesson')assert.equal(step.lessonId,lessons(j2)[1].lesson.id);
  complete(p,j2);step=getNextStep([m,m2],[j,j2],p);assert.equal(step.kind,'lesson');assert.equal(step.moduleId,m.id);
});
test('po wszystkich lekcjach proponujemy dobrowolną rozgrzewkę, bez komunikatu o zaległościach',()=>{
  const p=emptyProgress();complete(p,j);pending(p);
  let step=getNextStep([m],[j],p);assert.equal(step.kind,'practice');
  Object.values(p.adventure!.stageReviews![stageKey(j,j.stages[0])].items)[0].correct=3;
  p.words[keyFor(m,'word','apple')]='review';step=getNextStep([m],[j],p);assert.equal(step.kind,'practice');
  p.words={};p.difficult=['removed@1:word:apple'];assert.equal(getNextStep([m],[j],p).kind,'practice');
  assert.equal(getNextStep([],[],emptyProgress()).moduleId,null);
});
