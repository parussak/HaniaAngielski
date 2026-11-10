import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root=fileURLToPath(new URL('../',import.meta.url));
const skill=resolve(root,'.agents/skills/male-kroki-dokumentacja');

function prose(text){
  let fence=null;
  return text.split(/\r?\n/).map(line=>{
    const match=line.match(/^\s*(`{3,}|~{3,})/);
    if(match){if(!fence)fence=match[1];else if(match[1][0]===fence[0]&&match[1].length>=fence.length)fence=null;return '';}
    return fence?'':line.replace(/`[^`\n]*`/g,'');
  }).join('\n');
}

function checkLinks(file,text,exists=existsSync){
  let checked=0;const errors=[];
  for(const match of prose(text).matchAll(/!?\[[^\]\n]*\]\(\s*(<[^>\n]+>|[^)\n]+?)\s*\)/g)){
    let href=match[1];
    if(href.startsWith('<'))href=href.slice(1,-1);else href=href.replace(/\s+["'][^\n]*["']$/,'');
    if(/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(href))continue;
    const path=href.split(/[?#]/)[0];if(!path)continue;
    checked++;
    try{if(!exists(resolve(dirname(file),decodeURIComponent(path))))errors.push(`${file}: brak pliku dla ${href}`);}
    catch{errors.push(`${file}: niepoprawny odnośnik ${href}`);}
  }
  return {checked,errors};
}

function checkSkill(text,ui){
  const errors=[];
  const header=text.replace(/\r\n/g,'\n').match(/^---\nname: ([a-z0-9]+(?:-[a-z0-9]+)*)\ndescription: "([^"\n]+)"\n---\n/);
  if(!header||header[1]!=='male-kroki-dokumentacja'||header[2].length>1024)errors.push('Niepoprawny name/description w SKILL.md.');
  if(/\[TODO:/i.test(prose(text)))errors.push('SKILL.md zawiera nieuzupełniony szablon.');
  const short=ui.match(/short_description: "([^"\n]+)"/);
  if(!short||short[1].length<25||short[1].length>64)errors.push('Opis skilla w interfejsie wymaga 25–64 znaków.');
  if(!ui.includes('$male-kroki-dokumentacja'))errors.push('Domyślne polecenie nie wskazuje nazwy skilla.');
  return errors;
}

function selfTest(){
  const file=resolve(root,'docs/proba.md'),existing=new Set([resolve(root,'docs/istnieje.md'),resolve(root,'dwa slowa.md')]);
  const sample='[dobry](istnieje.md#naglowek)\n[zły](brak.md)\n[spacje](<../dwa slowa.md>)\n[WWW](https://example.invalid/brak)\n[kotwica](#sekcja)\n`[kod](nie-ma.md)`\n```md\n[przykład](nie-ma.md)\n```\n[uszkodzony](%ZZ.md)';
  const result=checkLinks(file,sample,path=>existing.has(path));
  assert.equal(result.checked,4);assert.equal(result.errors.length,2);
  assert.ok(result.errors[0].includes('brak.md'));assert.ok(result.errors[1].includes('%ZZ'));
  assert.equal(checkLinks(file,'![ilustracja](brak.svg)').errors.length,1);
  const valid='---\nname: male-kroki-dokumentacja\ndescription: "Krótki opis."\n---\nInstrukcje.';
  const ui='short_description: "Sprawdzanie polskiej dokumentacji"\ndefault_prompt: "Użyj $male-kroki-dokumentacja."';
  assert.deepEqual(checkSkill(valid,ui),[]);
  assert.ok(checkSkill(valid.replace('name:','inna:'),ui).length);
  assert.ok(checkSkill(valid+'\n[TODO: treść]',ui).length);
  console.log('OK: przypadki odnośników, braków, kodu, ilustracji i opisu skilla.');
}

function walk(folder){return readdirSync(folder,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(resolve(folder,e.name)):e.name.endsWith('.md')?[resolve(folder,e.name)]:[]);}

if(process.argv.includes('--self-test'))selfTest();
else {
  if(!existsSync(resolve(root,'docs/README.md'))||!existsSync(resolve(root,'public/content/katalog.json')))throw new Error('Nie znaleziono katalogu projektu Małe kroki.');
  const files=[...walk(resolve(root,'docs')),resolve(root,'README.md'),resolve(root,'public/content/README.md'),resolve(skill,'SKILL.md')];
  let checked=0;const errors=[];
  for(const file of files){const result=checkLinks(file,readFileSync(file,'utf8'));checked+=result.checked;errors.push(...result.errors);}
  errors.push(...checkSkill(readFileSync(resolve(skill,'SKILL.md'),'utf8'),readFileSync(resolve(skill,'agents/openai.yaml'),'utf8')));
  for(const error of errors)console.error(error.replaceAll(root,'.'));
  console.log(`${errors.length?'BŁĘDY':'OK'}: ${files.length} dokumentów, ${checked} lokalnych odnośników plikowych, opis skilla. Niczego nie zapisano.`);
  console.log('Poza kontrolą: kotwice nagłówków, zewnętrzne strony, zachowanie aplikacji i poprawność językowa.');
  if(errors.length)process.exitCode=1;
}
