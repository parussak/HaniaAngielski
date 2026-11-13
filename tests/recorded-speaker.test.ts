import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRecordedSpeaker,type AudioPlayer} from '../src/speech/recorded-speaker.ts';
import {recordingCatalog} from '../src/speech/recordings.ts';
import {speechKey} from '../src/speech/text.ts';
import {mediaRangeResponse} from '../scripts/service-worker-range.mjs';
import {runtimeAudioAssets} from '../scripts/audio/publish.mjs';
import {fileURLToPath} from 'node:url';
const apple={text:'an apple',language:'en',file:`clips/${'a'.repeat(64)}.ogg`},water={text:'water',language:'en',file:`clips/${'b'.repeat(64)}.ogg`};
class Media implements AudioPlayer {
 playbackRate=0;preservesPitch=false;paused=false;listeners=new Map<string,(()=>void)[]>();
 addEventListener(type:string,listener:()=>void){this.listeners.set(type,[...this.listeners.get(type)??[],listener]);}
 emit(type:string){for(const listener of this.listeners.get(type)??[])listener();}
 play(){this.emit('playing');return Promise.resolve();}pause(){this.paused=true;}
}
function device(t:any,tts=true){
 let enabled=true,changes=0;const kinds:string[]=[],spoken:unknown[][]=[],media:Media[]=[],urls:string[]=[];
 const fallback={enabled:()=>enabled,setEnabled:(on:boolean)=>{enabled=on;},available:(language?:string)=>enabled&&tts&&language==='en',speak:(text:string,language?:string,slow=false,kind='word')=>{kinds.push(kind);if(!fallback.available(language))return false;spoken.push([text,language,slow]);return true;},stop:()=>{}};
 const env={fallback,supported:()=>true,url:(file:string)=>`https://example.test/app/audio/${file}`,changed:()=>{changes++;},createAudio:(url:string)=>{urls.push(url);const a=new Media();media.push(a);return a;},timeoutMs:10};
 const speaker=createRecordedSpeaker(env);speaker.setCatalog([apple,water]);t.after(()=>speaker.stop());return {speaker,env,spoken,kinds,media,urls,changes:()=>changes};
}

test('nagranie jest pierwsze, można powtarzać i zwalniać ten sam plik bez zmiany wysokości głosu',t=>{
 const d=device(t);assert.equal(d.speaker.speak('an apple','en'),true);assert.equal(d.spoken.length,0);assert.equal(d.media[0].playbackRate,0.88);assert.equal(d.media[0].preservesPitch,true);
 d.speaker.speak('an apple','en',true);assert.equal(d.media[0].paused,true);assert.equal(d.media[1].playbackRate,0.616);assert.equal(d.urls[0],d.urls[1]);assert.equal(d.speaker.available('fr','an apple'),false);
});

test('domyślne tempo zależy od zastosowania; Wolniej zwalnia je dodatkowo, a błąd zachowuje rodzaj wypowiedzi',t=>{
 const d=device(t);
 d.speaker.speak('water','en',false,'dialogue');assert.equal(d.media.at(-1)!.playbackRate,0.75);
 d.speaker.speak('water','en',true,'dialogue');assert.equal(d.media.at(-1)!.playbackRate,0.525);
 d.speaker.speak('water','en');assert.equal(d.media.at(-1)!.playbackRate,0.88);
 d.speaker.speak('water','en',true);assert.equal(d.media.at(-1)!.playbackRate,0.616);
 d.speaker.speak('water','en',true,'dialogue');d.media.at(-1)!.emit('error');assert.equal(d.kinds.at(-1),'dialogue');assert.deepEqual(d.spoken.at(-1),['water','en',true]);
 d.speaker.speak('missing','en',false,'dialogue');assert.equal(d.kinds.at(-1),'dialogue');
});

test('brak konkretnego klipu przechodzi do syntezy lub zwykłego zadania, niezależnie od innych klipów',t=>{
 const d=device(t);assert.equal(d.speaker.speak('missing','en'),true);assert.deepEqual(d.spoken,[['missing','en',false]]);const silent=device(t,false);assert.equal(silent.speaker.available('en','missing'),false);assert.equal(silent.speaker.available('en','water'),true);assert.equal(silent.speaker.speak('missing','en'),false);
 silent.env.supported=()=>false;assert.equal(silent.speaker.available('en','water'),false);
});

test('błąd pliku uruchamia syntezę tylko raz, inne nagrania pozostają dostępne',t=>{
 const d=device(t);d.speaker.speak('an apple','en',true);d.media[0].emit('error');d.media[0].emit('error');assert.deepEqual(d.spoken,[['an apple','en',true]]);
 d.speaker.speak('an apple','en');assert.equal(d.media.length,1);assert.equal(d.spoken.length,2);d.speaker.speak('water','en');assert.equal(d.media.length,2);
});

test('bez syntezy błąd nagrania zgłasza zmianę do zwykłej formy tylko dla tego tekstu',t=>{
 const d=device(t,false);d.speaker.speak('an apple','en');d.media[0].emit('error');assert.equal(d.speaker.available('en','an apple'),false);assert.equal(d.speaker.available('en','water'),true);assert.equal(d.changes(),2);
 d.speaker.setEnabled(false);assert.equal(d.speaker.available('en','water'),false);d.speaker.setEnabled(true);assert.equal(d.speaker.available('en','an apple'),true);
});

test('spóźniony błąd po zmianie zadania lub zatrzymaniu nie odtwarza starego tekstu',t=>{
 const d=device(t);d.speaker.speak('an apple','en');d.speaker.speak('water','en');d.media[0].emit('error');assert.equal(d.spoken.length,0);d.speaker.stop();d.media[1].emit('error');assert.equal(d.spoken.length,0);
});

test('blokada autoplay nie wyłącza nagrania i pozwala ponowić je przyciskiem',async t=>{
 const d=device(t,false);d.env.createAudio=(url:string)=>{d.urls.push(url);const a=new Media();a.play=()=>Promise.reject(new DOMException('tap first','NotAllowedError'));d.media.push(a);return a;};
 d.speaker.speak('an apple','en');await Promise.resolve();await Promise.resolve();assert.equal(d.speaker.available('en','an apple'),true);assert.equal(d.changes(),1);assert.equal(d.spoken.length,0);
 d.speaker.speak('an apple','en');assert.equal(d.media.length,2);
});

test('zawieszone ładowanie ma ograniczony czas i przechodzi do syntezy',async t=>{
 const d=device(t);d.env.timeoutMs=1;d.env.createAudio=()=>{const a=new Media();a.play=()=>new Promise<void>(()=>{});d.media.push(a);return a;};d.speaker.speak('an apple','en');await new Promise(resolve=>setTimeout(resolve,20));assert.equal(d.spoken.length,1);assert.equal(d.media[0].paused,true);
});

test('nieoczekiwane przerwanie aktualnego ładowania przechodzi do syntezy zamiast zostawić ciche zadanie',async t=>{
 const d=device(t);d.env.createAudio=()=>{const a=new Media();a.play=()=>Promise.reject(new DOMException('load aborted','AbortError'));d.media.push(a);return a;};d.speaker.speak('an apple','en');await Promise.resolve();await Promise.resolve();assert.equal(d.spoken.length,1);
});

test('indeks nie akceptuje adresów zewnętrznych, wyjścia poza katalog ani powtórzonych tekstów',()=>{
 assert.deepEqual(recordingCatalog({version:1,entries:[apple]}),[apple]);assert.equal(speechKey(' an  apple ','EN'),speechKey(apple.text,'en'));
 for(const file of ['https://outside.test/a.ogg','../clip.ogg','clips/not-a-hash.ogg'])assert.throws(()=>recordingCatalog({version:1,entries:[{...apple,file}]}));assert.throws(()=>recordingCatalog({version:1,entries:[apple,{...apple,text:' an apple '}]}));
});

test('cache PWA odpowiada na zakresy bajtów, zachowując typ audio i długość',async()=>{
 for(const [range,body,content] of [['bytes=1-3','bcd','bytes 1-3/6'],['bytes=3-','def','bytes 3-5/6'],['bytes=-2','ef','bytes 4-5/6'],['bytes=0-999','abcdef','bytes 0-5/6']]){
  const r=await mediaRangeResponse(new Request('https://example.test/a.ogg',{headers:{Range:range}}),new Response('abcdef',{headers:{'Content-Type':'audio/ogg'}}));assert.equal(r.status,206);assert.equal(r.headers.get('Content-Range'),content);assert.equal(r.headers.get('Content-Type'),'audio/ogg');assert.equal(await r.text(),body);
 }
 for(const range of ['bytes=8-','bytes=3-1','bytes=-0','bytes=0-1,3-4','nonsense'])assert.equal((await mediaRangeResponse(new Request('https://example.test/a.ogg',{headers:{Range:range}}),new Response('abcdef'))).status,416);
});

test('publikowane są tylko mały indeks i istniejące nagrania, bez modelu i konfiguracji generatora',async()=>{
 const assets=await runtimeAudioAssets(fileURLToPath(new URL('../',import.meta.url))),catalog=recordingCatalog(JSON.parse(assets.get('audio/catalog.json')!.toString()));assert.ok(catalog.length>0);assert.equal(assets.size,catalog.length+1);
 for(const e of catalog)assert.ok(assets.get(`audio/${e.file}`));assert.ok([...assets.keys()].every(k=>k==='audio/catalog.json'||/^audio\/clips\/[a-f0-9]{64}\.ogg$/.test(k)));
});
