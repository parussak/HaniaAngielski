import type {Speaker} from '../speech.ts';
import type {Recording} from './recordings.ts';
import {speechKey} from './text.ts';
import {speakingRate} from './tempo.ts';
import type {PlaybackRecord} from './playback.ts';
export interface AudioPlayer {
 playbackRate:number;preservesPitch:boolean;volume?:number;
 play():Promise<void>|void;pause():void;
 addEventListener(type:string,listener:()=>void):void;
}
export interface RecordedEnvironment {
 fallback:Speaker;
 supported:()=>boolean;
 createAudio:(url:string)=>AudioPlayer;
 url:(file:string)=>string;
 changed:()=>void;
 /** Poziom 0–1 czytany przy każdym odtworzeniu. */
 volume?:()=>number;
 timeoutMs?:number;
}
export interface RecordedSpeaker extends Speaker {
 setCatalog(entries:Recording[]):void;
 /** The file that holds this text in the catalog, whether or not it plays now. */
 recordingOf(text:string,language:string):string|undefined;
 /** D-80: how the last attempt went, for a problem report. Never read by learning. */
 lastPlayback():PlaybackRecord|undefined;
}
/** Playback has no access to account state or progress. A failed file affects only that file. */
export function createRecordedSpeaker(env:RecordedEnvironment):RecordedSpeaker {
 let entries=new Map<string,Recording>(),broken=new Set<string>(),last:PlaybackRecord|undefined,epoch=0,active:AudioPlayer|undefined,timer:ReturnType<typeof setTimeout>|undefined;
 const clear=()=>{if(timer!==undefined)clearTimeout(timer);timer=undefined;};
 const stop=()=>{epoch++;clear();try{active?.pause();}catch{/* already stopped */}active=undefined;env.fallback.stop();};
 const find=(language:string|undefined,text?:string)=>{
  if(!language||!env.fallback.enabled()||!env.supported())return;
  if(text!==undefined){const entry=entries.get(speechKey(text,language));return entry&&!broken.has(entry.file)?entry:undefined;}
  return [...entries.values()].find(e=>e.language.toLowerCase().replace(/_/g,'-')===language.toLowerCase().replace(/_/g,'-')&&!broken.has(e.file));
 };
 return {
  enabled:()=>env.fallback.enabled(),
  setEnabled(on){stop();env.fallback.setEnabled(on);if(on)broken.clear();},
  recordingOf:(text,language)=>entries.get(speechKey(text,language))?.file,
  lastPlayback:()=>last&&{...last},
  setCatalog(catalog){entries=new Map(catalog.map(e=>[speechKey(e.text,e.language),{...e}]));env.changed();},
  available:(language,text)=>!!find(language,text)||env.fallback.available(language,text),
  stop,
  speak(text,language,slow=false,kind='word'){
   stop();const entry=find(language,text),known=language?entries.get(speechKey(text,language)):undefined,file=known?{recordingFile:known.file}:{};
   if(!entry){const spoken=env.fallback.speak(text,language,slow,kind);last={text,language:language??'',via:spoken?'device-voice':'none',...file,...(known&&broken.has(known.file)?{recordingFailed:true as const}:{})};return spoken;}
   last={text,language:language!,via:'recording',...file};
   const current=epoch;let finished=false;
   const fail=(error:unknown)=>{
    if(current!==epoch||finished)return false;finished=true;clear();try{active?.pause();}catch{/* already stopped */}active=undefined;
    const name=error&&typeof error==='object'&&'name' in error?String(error.name):'';
    if(name==='NotAllowedError')return false; // A tap can retry. Our own cancellations were already excluded by epoch.
    broken.add(entry.file);const spoken=env.fallback.speak(text,language,slow,kind);last={text,language:language!,via:spoken?'device-voice':'none',...file,recordingFailed:true};if(!spoken)env.changed();return spoken;
   };
   try{
    active=env.createAudio(env.url(entry.file));active.playbackRate=speakingRate(slow,kind);active.preservesPitch=true;if(env.volume)active.volume=env.volume();
    active.addEventListener('error',()=>fail(Error('Nagranie niedostępne.')));
    active.addEventListener('playing',()=>{if(current===epoch)clear();});
    active.addEventListener('ended',()=>{if(current===epoch){finished=true;clear();active=undefined;}});
    timer=setTimeout(()=>fail(Error('Nagranie nie zaczęło się odtwarzać.')),env.timeoutMs??8000);
    Promise.resolve(active.play()).catch(fail);return true;
   }catch(error){return fail(error);}
  }
 };
}
