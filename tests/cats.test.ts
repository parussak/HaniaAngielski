import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateCats,responseCat,endingCat,sceneCats} from '../src/cats.ts';
import {engineModules as modules} from './fixtures/engine.ts';
import {emptyProgress,makeSession,backup,validateBackup} from '../src/core.ts';
const raw=JSON.parse(readFileSync(new URL('../public/cats/catalog.json',import.meta.url),'utf8'));
const catalog=validateCats(raw);
const session=()=>makeSession(modules,modules[0],'flashcards','text',false,emptyProgress());

test('rozmówcy mają różne koty i stałą obsadę po wznowieniu, nowa sesja może ją zmienić',()=>{
 const scene={id:'dialogue',lines:[{speaker:'A',text:'Hello'},{speaker:'B',text:'Hi'},{speaker:'A',text:'Bye'}]},s=session();
 const cast=sceneCats(catalog,s,scene),again=sceneCats(catalog,structuredClone(s),scene);
 assert.equal(cast.size,2);assert.notEqual(cast.get('A')!.id,cast.get('B')!.id);assert.deepEqual([...again],[...cast]);
 assert.equal(sceneCats(catalog,s,scene).get('A')!.id,cast.get('A')!.id);
 const variants=new Set(Array.from({length:30},(_,i)=>[...sceneCats(catalog,{id:`session-${i}`},scene).values()].map(cat=>cat.id).join('/')));assert.ok(variants.size>1);
});

test('pięć zaakceptowanych kotków, 25 wersji i istniejące pliki ilustracji',()=>{
  assert.deepEqual(catalog.cats.map(c=>c.name),['Albert','Oluś','Felix','Maja','Krzywołap']);
  assert.equal(catalog.cats.reduce((n,c)=>n+3+c.funny.length,0),25);
  for(const sheet of Object.values(catalog.sheets)){
    const png=readFileSync(new URL('../public/'+sheet.src,import.meta.url));assert.equal(png.readUInt32BE(16),sheet.width);assert.equal(png.readUInt32BE(20),sheet.height);
  }
  const outside=structuredClone(raw);outside.cats[0].teacher.x=99999;assert.throws(()=>validateCats(outside));
  const external=structuredClone(raw);external.sheets.classic.src='https://example.com/cat.png';assert.throws(()=>validateCats(external));
});

test('po błędzie nauczyciel, po poprawie zadowolony lub świętujący, bez sąsiednich powtórek',()=>{
  const s=session();s.lastCorrect=false;
  const ids=[];
  for(let i=0;i<10;i++){s.index=i;const r=responseCat(catalog,s);assert.equal(r.mood,'teacher');assert.deepEqual(r.frame,r.cat.teacher);ids.push(r.cat.id);}
  assert.equal(new Set(ids.slice(0,5)).size,5);assert.ok(ids.every((id,i)=>!i || id!==ids[i-1]));
  const moods=new Set();
  for(let i=0;i<30;i++){s.id=`session-${i}`;s.index=0;s.lastCorrect=true;moods.add(responseCat(catalog,s).mood);}
  assert.deepEqual([...moods].sort(),['celebrating','happy']);
});

test('odświeżenie i kopia zachowują reakcję bez dodawania danych do postępów',()=>{
  const p=emptyProgress();p.active=session();p.active.lastCorrect=false;
  const item=p.active.items[0];p.active.attempts=[{key:item.key,first:false,answer:'wrong',corrections:0,corrected:false}];p.active.phase='feedback';
  const first=responseCat(catalog,p.active),restored=validateBackup(backup(p)).progress;
  assert.deepEqual(responseCat(catalog,restored.active!),first);
  p.active.lastCorrect=true;p.active.attempts[0].corrections=1;
  const corrected=responseCat(catalog,p.active);assert.equal(corrected.cat.id,first.cat.id);assert.notEqual(corrected.mood,'teacher');
});

test('na końcu lekcji losowane są obie zabawne scenki wszystkich kotków',()=>{
  const seen=new Set<string>();
  for(let i=0;i<100;i++){
    const s={id:`end-${i}`},r=endingCat(catalog,s);assert.equal(r.mood,'funny');assert.deepEqual(endingCat(catalog,s),r);
    seen.add(`${r.cat.id}:${r.cat.funny.indexOf(r.frame)}`);
  }
  assert.equal(seen.size,10);
});
