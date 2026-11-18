import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import ts from 'typescript';
import {journeyKey,lessonKey,lessons,type Journey} from '../src/learning/journey.ts';
import * as oldJourneyAPI from '../src/adventure.ts';
import {polishCount} from '../src/polish-count.ts';
import {exerciseCount} from '../src/learning/map-progress.ts';
import {pendingLabel} from '../src/stage-review.ts';
import {validateBackup,backup} from '../src/core.ts';
import {slotIds} from '../src/house/catalog.ts';
import {legacyCourse} from '../src/materials/identity.ts';

// An architectural guard checks runtime imports after type erasure, rather
// than relying on source filenames, formatting or the spelling of UI text.
function runtime(file:URL){
 const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 return ts.createSourceFile('runtime.js',code,ts.ScriptTarget.ES2022,true,ts.ScriptKind.JS);
}
function imports(source:ts.SourceFile,file:URL):URL[]{
 return source.statements.flatMap(node=>(ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier&&ts.isStringLiteral(node.moduleSpecifier)&&node.moduleSpecifier.text.startsWith('.')&&node.moduleSpecifier.text.endsWith('.ts')?[new URL(node.moduleSpecifier.text,file)]:[]);
}
function reachable(file:URL,seen=new Set<string>()):Set<string>{
 if(seen.has(file.href))return seen;seen.add(file.href);
 for(const next of imports(runtime(file),file))reachable(next,seen);
 return seen;
}
test('domek nie zależy w czasie działania od modułu map i przyznawania nagród',()=>{
 const imports=reachable(new URL('../src/house/progress.ts',import.meta.url));
 assert.ok(!imports.has(new URL('../src/adventure.ts',import.meta.url).href));
});

// Zasada 2 (docs/zasady-kodu.md): logika nie używa wejścia/wyjścia i nie sięga do warstwy aplikacji.
const src=new URL('../src/',import.meta.url);
const rel=(href:string)=>href.slice(src.href.length);
const logicFiles=(dir:URL):URL[]=>readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?logicFiles(new URL(`${d.name}/`,dir)):d.name.endsWith('.ts')?[new URL(d.name,dir)]:[]);
const logic=['learning/','materials/','house/'].flatMap(dir=>logicFiles(new URL(dir,src)));
const appLayer=(path:string)=>['app/','controllers/','views/','services/'].some(dir=>path.startsWith(dir))||['main.ts','firebase.ts','sync.ts','storage.ts','speech.ts','pwa.ts','ui.ts'].includes(path);
const browserGlobals=new Set(['document','window','localStorage','sessionStorage','indexedDB','navigator','location','history','requestAnimationFrame','HTMLElement','Element']);
// Globalne obiekty przeglądarki użyte jako wartość — nie nazwa pola ani własnej zmiennej.
function browserGlobalsIn(source:ts.SourceFile){
 const declared=new Set<string>(),used=new Set<string>();
 const visit=(node:ts.Node)=>{
  if((ts.isVariableDeclaration(node)||ts.isParameter(node)||ts.isFunctionDeclaration(node)||ts.isBindingElement(node)||ts.isImportSpecifier(node)||ts.isNamespaceImport(node))&&node.name&&ts.isIdentifier(node.name))declared.add(node.name.text);
  if(ts.isIdentifier(node)&&browserGlobals.has(node.text)){
   const p=node.parent;
   if(!((ts.isPropertyAccessExpression(p)||ts.isPropertyAssignment(p)||ts.isMethodDeclaration(p)||ts.isPropertyDeclaration(p))&&p.name===node))used.add(node.text);
  }
  ts.forEachChild(node,visit);
 };
 visit(source);
 return [...used].filter(name=>!declared.has(name)).sort();
}
test('logika nie importuje warstwy aplikacji, widoków, kontrolerów ani usług',()=>{
 assert.ok(logic.length>10);
 const problems=logic.flatMap(file=>[...reachable(file)].map(rel).filter(appLayer).map(path=>`${rel(file.href)} → ${path}`));
 assert.deepEqual(problems,[]);
});
test('logika nie używa globalnych obiektów przeglądarki',()=>{
 const problems=logic.flatMap(file=>browserGlobalsIn(runtime(file)).map(name=>`${rel(file.href)}: ${name}`));
 assert.deepEqual(problems,[]);
});
test('kontrola granic wykrywa zakazany import i obiekt przeglądarki, a pomija pola o tej samej nazwie',()=>{
 const source=ts.createSourceFile('x.js',"import {e} from '../ui.ts';\nexport const f=()=>document.title+window.x;\nexport const g={document:1,location:f.location};\nconst history=[];",ts.ScriptTarget.ES2022,true,ts.ScriptKind.JS);
 assert.deepEqual(imports(source,new URL('learning/x.ts',src)).map(u=>rel(u.href)).filter(appLayer),['ui.ts']);
 assert.deepEqual(browserGlobalsIn(source),['document','window']);
});
test('wydzielone klucze map zachowują stare API, klucze i kolejność lekcji',()=>{
 const j=JSON.parse(readFileSync(new URL('../public/content/02-food/sciezka.json',import.meta.url),'utf8')) as Journey;
 assert.equal(oldJourneyAPI.journeyKey,journeyKey);assert.equal(oldJourneyAPI.lessonKey,lessonKey);assert.equal(oldJourneyAPI.lessons,lessons);
 assert.equal(journeyKey(j),'unit-2-food');assert.equal(lessons(j)[0].key,`unit-2-food/${j.stages[0].lessons[0].id}`);
 assert.equal(journeyKey({...j,id:'practice'}),'unit-2-food/practice');assert.equal(lessons(j).length,41);
});
test('wspólna odmiana zachowuje formy liczebników i etykiety powtórek',()=>{
 for(const [n,word] of [[0,'ćwiczeń'],[1,'ćwiczenie'],[2,'ćwiczenia'],[4,'ćwiczenia'],[5,'ćwiczeń'],[12,'ćwiczeń'],[14,'ćwiczeń'],[21,'ćwiczeń'],[22,'ćwiczenia'],[112,'ćwiczeń']] as const){
  assert.equal(exerciseCount(n),`${n} ${word}`);assert.equal(polishCount(n,'ćwiczenie','ćwiczenia','ćwiczeń'),`${n} ${word}`);
 }
 assert.equal(pendingLabel({words:1,tasks:2}),'1 słówko i 2 zadania');assert.equal(pendingLabel({words:12,tasks:0}),'12 słówek');
});
test('wspólne identyfikatory nie zmieniają starej kopii ani walidacji miejsc i portfela angielskiego',()=>{
 const old=JSON.parse(readFileSync(new URL('./fixtures/backup-v1.json',import.meta.url),'utf8'));
 assert.equal(JSON.stringify(validateBackup(old)),JSON.stringify(old));
 for(const slot of [...slotIds,null]){
  const b=backup(old.progress);b.progress.adventure={version:1,earned:10,completed:{},purchases:{pillow:{cost:6,slot}}};
  assert.deepEqual(validateBackup(b),b);
 }
 const b=backup(old.progress);b.progress.adventure={version:1,earned:10,completed:{},purchases:{pillow:{cost:6,slot:'outside'}}};
 assert.throws(()=>validateBackup(b));b.progress.adventure.purchases.pillow.slot=null;
 b.progress.adventure.courseHomes={[legacyCourse]:{earned:0,purchases:{}}};assert.throws(()=>validateBackup(b));
});
