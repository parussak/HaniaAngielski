import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import ts from 'typescript';
import {actionOwners,ownerOf,type ActionOwner} from '../src/app/actions.ts';

// Spis akcji (src/app/actions.ts): „kto obsługuje akcję X” to jedno wyszukanie. Test czyta kod
// przez drzewo składni, więc nie zależy od formatowania ani od zapisu `if` / `switch`.
const src=new URL('../src/',import.meta.url);
const sourceFiles=(dir:URL):URL[]=>readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?sourceFiles(new URL(`${d.name}/`,dir)):d.name.endsWith('.ts')?[new URL(d.name,dir)]:[]);
const parse=(file:URL)=>ts.createSourceFile(file.pathname,readFileSync(file,'utf8'),ts.ScriptTarget.ES2022,true);
const walk=(node:ts.Node,visit:(n:ts.Node)=>void)=>{visit(node);node.forEachChild(child=>walk(child,visit));};

// Plik kontrolera, który obsługuje akcje danego właściciela.
const handlers:Record<ActionOwner,string>={
 app:'controllers/app.ts',speech:'controllers/speech.ts',house:'controllers/house.ts',account:'controllers/account.ts',backup:'controllers/backup.ts',
 navigation:'controllers/learning.ts',starts:'controllers/session-start.ts',answers:'controllers/session-answers.ts',reading:'controllers/reading.ts',preview:'controllers/task-preview.ts',
};
const all=Object.entries(actionOwners).flatMap(([owner,actions])=>(actions as readonly string[]).map(action=>({owner,action})));

test('każda akcja ze spisu ma dokładnie jednego właściciela',()=>{
 const seen=new Map<string,string>();
 for(const {owner,action} of all){
  assert.ok(!seen.has(action),`akcja „${action}” jest u dwóch właścicieli: ${seen.get(action)} i ${owner}`);
  seen.set(action,owner);assert.equal(ownerOf(action),owner);
 }
 assert.equal(ownerOf('nie-ma-takiej-akcji'),undefined);
});

test('każdy kontroler obsługuje dokładnie akcje swojego właściciela ze spisu',()=>{
 for(const [owner,file] of Object.entries(handlers)){
  const handled=new Set<string>();
  walk(parse(new URL(file,src)),node=>{
   // Tylko `switch(action)`; inne przełączniki (np. rodzaj kroku) nie są akcjami.
   if(!ts.isSwitchStatement(node)||!ts.isIdentifier(node.expression)||node.expression.text!=='action')return;
   for(const clause of node.caseBlock.clauses)if(ts.isCaseClause(clause)&&ts.isStringLiteralLike(clause.expression))handled.add(clause.expression.text);
  });
  const declared=new Set<string>(actionOwners[owner as ActionOwner]);
  assert.deepEqual([...handled].sort(),[...declared].sort(),`kontroler ${file} obsługuje inne akcje, niż wpisano właścicielowi „${owner}”`);
 }
});

test('widoki budują data-action tylko z typu, a użyte nazwy są w spisie',()=>{
 const known=new Set(all.map(a=>a.action));const used=new Set<string>();
 for(const file of sourceFiles(src)){
  const rel=file.href.slice(src.href.length);
  walk(parse(file),node=>{
   // Surowy zapis `data-action=` pozwalałby na literówkę, której kompilator nie złapie.
   if((ts.isStringLiteralLike(node)||ts.isTemplateHead(node)||ts.isTemplateMiddle(node)||ts.isTemplateTail(node))&&node.text.includes('data-action=')&&rel!=='ui.ts')
    assert.fail(`${rel}: surowe data-action= — użyj act('…') z ui.ts`);
   if(!ts.isCallExpression(node)||!ts.isIdentifier(node.expression))return;
   const index=({act:0,button:0,catInvitation:3} as Record<string,number>)[node.expression.text];
   if(index===undefined)return;
   const literals:string[]=[];
   walk(node.arguments[index],n=>{if(ts.isStringLiteralLike(n))literals.push(n.text);});
   // `act(a)` z samą zmienną ma typ AppAction; sprawdzamy tylko jawne napisy.
   for(const literal of literals){used.add(literal);assert.ok(known.has(literal),`${rel}: akcja „${literal}” nie jest w spisie`);}
  });
 }
 assert.ok(used.size>20,'test nie znalazł akcji w widokach — zmienił się sposób ich budowania?');
});

// Konstytucja, pkt 6: dane akcji są typowane. `dataset` czyta tylko granica zdarzeń (src/app/), więc kontrolery
// i planery dostają gotowy payload i nie wiedzą, że istnieje DOM.
test('kontrolery i planery nie sięgają do dataset — payload czyta granica zdarzeń',()=>{
 const files=[...sourceFiles(new URL('controllers/',src)),...sourceFiles(new URL('learning/',src))];
 assert.ok(files.length>20);
 const offenders:string[]=[];
 for(const file of files)walk(parse(file),node=>{
  if(ts.isPropertyAccessExpression(node)&&node.name.text==='dataset')offenders.push(file.href.slice(src.href.length));
  if(ts.isTypeReferenceNode(node)&&node.typeName.getText()==='DOMStringMap')offenders.push(file.href.slice(src.href.length));
 });
 assert.deepEqual(offenders,[]);
});
