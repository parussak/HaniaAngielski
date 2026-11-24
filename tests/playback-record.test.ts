// D-80: the speaker remembers how its last attempt went, so a report can say "file" or "device voice".
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRecordedSpeaker,type AudioPlayer} from '../src/speech/recorded-speaker.ts';
const apple={text:'an apple',language:'en',file:`clips/${'a'.repeat(64)}.ogg`};
class Media implements AudioPlayer {
 playbackRate=0;preservesPitch=false;listeners=new Map<string,(()=>void)[]>();
 addEventListener(type:string,listener:()=>void){this.listeners.set(type,[...this.listeners.get(type)??[],listener]);}
 emit(type:string){for(const listener of this.listeners.get(type)??[])listener();}
 play(){this.emit('playing');return Promise.resolve();}pause(){}
}
function device(t:any,tts:boolean){
 const media:Media[]=[];
 const fallback={enabled:()=>true,setEnabled(){},available:()=>tts,speak:()=>tts,stop(){}};
 const speaker=createRecordedSpeaker({fallback,supported:()=>true,url:f=>`https://example.test/${f}`,changed(){},createAudio:()=>{const m=new Media();media.push(m);return m;},timeoutMs:10});
 speaker.setCatalog([apple]);t.after(()=>speaker.stop());return {speaker,media};
}

test('nic jeszcze nie odtworzono: brak zapisu próby, ale plik nagrania jest znany z katalogu',t=>{
 const {speaker}=device(t,true);
 assert.equal(speaker.lastPlayback(),undefined);
 assert.equal(speaker.recordingOf('an apple','en'),apple.file);assert.equal(speaker.recordingOf('missing','en'),undefined);
});

test('próba z nagraniem zapisuje plik; błąd pliku z głosem urządzenia zapisuje zmianę i awarię pliku',t=>{
 const {speaker,media}=device(t,true);
 speaker.speak('an apple','en');
 assert.deepEqual(speaker.lastPlayback(),{text:'an apple',language:'en',via:'recording',recordingFile:apple.file});
 media[0].emit('error');
 assert.deepEqual(speaker.lastPlayback(),{text:'an apple',language:'en',via:'device-voice',recordingFile:apple.file,recordingFailed:true});
});

test('brak nagrania i brak głosu: próba zapisana jako nieudana (none), a plik nie jest zgadywany',t=>{
 const {speaker}=device(t,false);
 assert.equal(speaker.speak('missing','en'),false);
 assert.deepEqual(speaker.lastPlayback(),{text:'missing',language:'en',via:'none'});
 const second=device(t,true);second.speaker.speak('missing','en');
 assert.deepEqual(second.speaker.lastPlayback(),{text:'missing',language:'en',via:'device-voice'});
});

test('uszkodzony plik i brak głosu: próba kończy się none z oznaczeniem awarii pliku',t=>{
 const {speaker,media}=device(t,false);
 speaker.speak('an apple','en');media[0].emit('error');
 assert.deepEqual(speaker.lastPlayback(),{text:'an apple',language:'en',via:'none',recordingFile:apple.file,recordingFailed:true});
});
