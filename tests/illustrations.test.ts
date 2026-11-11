import {test} from 'node:test';
import {existsSync} from 'node:fs';
import assert from 'node:assert/strict';
import {foodModules as modules} from './materials.ts';
import {emptyProgress,makeSession,inputFor,questionFor,requiresChoice} from '../src/core.ts';
import {validateModules} from '../src/content-validation.ts';

test('Food: ilustracje słówek, quizu i gramatyki są częścią treści',()=>{
  const m=modules[0];
  for(const element of [...m.words,...m.exercises]){
    assert.ok(element.illustration?.symbol || element.illustration?.src,element.id);
    assert.ok(element.illustration?.caption,element.id);
    if(element.illustration?.src)assert.ok(existsSync(new URL(`../public/${element.illustration.src}`,import.meta.url)));
  }
  const session=makeSession(modules,m,'flashcards','text',false,emptyProgress());
  for(const item of session.items)assert.deepEqual(questionFor(modules,item).illustration,m.words.find(w=>w.id===item.id)!.illustration);
  const invalid=structuredClone(modules);invalid[0].words[0].illustration={symbol:'',caption:'test'};
  assert.throws(()=>validateModules(invalid),/ilustracja/);
});

test('warianty w nawiasach zawsze do kliknięcia, również w starej sesji tekstowej',()=>{
  const m=modules[0];const closed=m.exercises.filter(q=>q.responseType==='choice');
  assert.equal(closed.length,37);
  for(const q of closed)assert.equal(inputFor(q,'text'),'choice');
  const example=m.exercises.find(q=>q.id==='g-because-sport')!;
  assert.ok(requiresChoice({...example,responseType:undefined}));
  assert.ok(requiresChoice({...example,responseType:undefined,prompt:'Uzupełnij [so / because]: ___'}));
  assert.ok(!requiresChoice(m.exercises.find(q=>q.id==='g-container-water')!));
  for(let i=0;i<20;i++){
    const s=makeSession(modules,m,'grammar','text',false,emptyProgress());
    for(const item of s.items)assert.equal(item.input,requiresChoice(questionFor(modules,item))?'choice':'text');
  }
});
