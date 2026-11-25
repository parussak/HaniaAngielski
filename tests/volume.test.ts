// Głośność wymowy i efektów: dwa niezależne poziomy zapamiętane na urządzeniu.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createVolumeSettings,volumeKeys} from '../src/volume.ts';
import {createCuePlayer} from '../src/sounds.ts';
import {createSpeaker,type SpeechEnvironment} from '../src/speech.ts';
import {createRecordedSpeaker,type AudioPlayer} from '../src/speech/recorded-speaker.ts';

const memory=(initial:Record<string,string>={})=>{const data={...initial};return {data,storage:{getItem:(k:string)=>data[k]??null,setItem:(k:string,v:string)=>{data[k]=v;}}};};

test('wartości początkowe: wymowa 100%, efekty 30%',()=>{
 const v=createVolumeSettings(memory().storage);
 assert.equal(v.speech(),100);assert.equal(v.cues(),30);
 assert.equal(createVolumeSettings(undefined).cues(),30);
});

test('suwaki są niezależne, ograniczone do 0–100 i zapamiętane po ponownym otwarciu',()=>{
 const m=memory(),v=createVolumeSettings(m.storage);
 v.setSpeech(55);assert.equal(v.speech(),55);assert.equal(v.cues(),30);
 v.setCues(80);assert.equal(v.speech(),55);assert.equal(v.cues(),80);
 v.setSpeech(250);assert.equal(v.speech(),100);v.setCues(-5);assert.equal(v.cues(),0);v.setCues(42.6);assert.equal(v.cues(),43);
 const again=createVolumeSettings(m.storage);assert.equal(again.speech(),100);assert.equal(again.cues(),43);
 assert.ok(volumeKeys.speech!==volumeKeys.cues);
});

test('zepsuty zapis i zablokowany magazyn dają wartości początkowe, bez wyjątków',()=>{
 const bad=createVolumeSettings(memory({[volumeKeys.speech]:'głośno',[volumeKeys.cues]:'999'}).storage);
 assert.equal(bad.speech(),100);assert.equal(bad.cues(),30);
 const blocked=createVolumeSettings({getItem:()=>{throw Error('x');},setItem:()=>{throw Error('x');}});
 assert.doesNotThrow(()=>blocked.setCues(10));assert.equal(blocked.cues(),10);
});

test('efekty: głośność czytana przy każdym odtworzeniu, 0% wycisza, wymowa nie wpływa',()=>{
 const v=createVolumeSettings(memory().storage),played:number[]=[];
 const player=createCuePlayer({url:f=>f,createAudio:()=>{const a={volume:1,play:()=>{played.push(a.volume);return Promise.resolve();}};return a;},volume:()=>v.cues()/100});
 player.play('correct');v.setCues(70);player.play('lesson');v.setSpeech(0);player.play('map');v.setCues(0);player.play('correct');
 assert.deepEqual(played,[0.3,0.7,0.7,0]);
});

class Media implements AudioPlayer{playbackRate=0;preservesPitch=false;volume=1;listeners=new Map<string,(()=>void)[]>();
 addEventListener(t:string,l:()=>void){this.listeners.set(t,[...this.listeners.get(t)??[],l]);}play(){return Promise.resolve();}pause(){}}

test('wymowa z nagrania: głośność ustawiana także przy wolniejszym odsłuchu; efekty jej nie zmieniają',()=>{
 const v=createVolumeSettings(memory().storage),media:Media[]=[];
 const fallback={enabled:()=>true,setEnabled(){},available:()=>false,speak:()=>false,stop(){}};
 const s=createRecordedSpeaker({fallback,supported:()=>true,url:f=>f,changed(){},createAudio:()=>{const a=new Media();media.push(a);return a;},volume:()=>v.speech()/100});
 s.setCatalog([{text:'water',language:'en',file:'clips/b.ogg'}]);
 s.speak('water','en');v.setSpeech(40);s.speak('water','en',true);v.setCues(0);v.setSpeech(0);s.speak('water','en');
 assert.deepEqual(media.map(m=>m.volume),[1,0.4,0]);
});

test('wymowa z głosu urządzenia: głośność trafia do wypowiedzi, także przy 0%',()=>{
 const v=createVolumeSettings(memory().storage),volumes:number[]=[];
 class U{lang='';rate=1;volume=1;voice:unknown=null;onerror=null;text:string;constructor(text:string){this.text=text;}}
 const env:SpeechEnvironment={Utterance:U as never,volume:()=>v.speech()/100,synth:{getVoices:()=>[{lang:'en-GB',localService:true}],cancel(){},speak:(u:never)=>{volumes.push((u as unknown as U).volume);}}};
 const s=createSpeaker(env);s.speak('apple','en');v.setSpeech(25);s.speak('apple','en',true);v.setSpeech(0);s.speak('apple','en');
 assert.deepEqual(volumes,[1,0.25,0]);
});

test('zmiana głośności wymowy nie włącza wyłączonej wymowy',()=>{
 const m=memory({'male-kroki:sluchanie':'off'}),v=createVolumeSettings(m.storage);
 const s=createSpeaker({storage:m.storage,volume:()=>v.speech()/100});
 v.setSpeech(60);v.setSpeech(100);
 assert.equal(s.enabled(),false);assert.equal(m.data['male-kroki:sluchanie'],'off');
});

import {volumeSettingsView} from '../src/views/volume-settings.ts';
test('widok: dwa suwaki 0–100 z wartością procentową i przyciskami „Posłuchaj”',()=>{
 const html=volumeSettingsView({speech:100,cues:30},{text:'an apple',language:'en'});
 assert.match(html,/id="volume-speech"[^>]*min="0"[^>]*max="100"[^>]*value="100"/);
 assert.match(html,/id="volume-cues"[^>]*min="0"[^>]*max="100"[^>]*value="30"/);
 assert.match(html,/id="volume-speech-value">100%</);assert.match(html,/id="volume-cues-value">30%</);
 assert.equal((html.match(/Posłuchaj</g)??[]).length,2);
 assert.match(html,/data-preview-cue="correct"/);assert.match(html,/data-action="listen"[^>]*data-say="an apple"/);
 assert.match(volumeSettingsView({speech:0,cues:0}).replace(/\s+/g,' '),/disabled/);
});
