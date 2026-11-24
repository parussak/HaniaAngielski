import {listeningTask,vocabularyPlayback} from './listening.ts';
import {questionFor} from './questions.ts';
import {readingView} from './readings.ts';
import {sceneView} from './scenes.ts';
import type {Module,Session} from './model.ts';
import {speechKey} from '../speech/text.ts';
import type {PlaybackRecord,PlaybackVia} from '../speech/playback.ts';

/**
 * D-80: a learner's report of a problem with the task on screen. Everything here decides
 * and describes; asking, saving and sending belong to `controllers/report.ts`.
 * Nothing in a report is guessed: a field that is not known is left out.
 */
export const reportCategories=['no-sound','unclear','wrong-content','other'] as const;
export type ReportCategory=typeof reportCategories[number];
export const reportLabels:Record<ReportCategory,string>={
 'no-sound':'Nic nie słychać','unclear':'Słychać, ale trudno zrozumieć','wrong-content':'W zadaniu lub odpowiedzi jest błąd','other':'Coś innego'};
export const isAudioCategory=(category:ReportCategory)=>category==='no-sound'||category==='unclear';
/** The two sound questions only make sense for material with sound. */
export const categoriesFor=(hasAudio:boolean):ReportCategory[]=>reportCategories.filter(c=>hasAudio||!isAudioCategory(c));

export const limits={comment:500,excerpt:160,text:500} as const;
const clip=(value:string,max:number)=>value.trim().slice(0,max);

export type {PlaybackRecord,PlaybackVia};

/** One thing the learner can hear on the screen. `line` is the place in a conversation or a reading. */
export interface Utterance{text:string;language:string;label:string;line?:number;speaker?:string;recordingFile?:string;playback?:PlaybackVia;recordingFailed?:true}

const voice=(text:string,language:string,label:string,extra:Partial<Utterance>={}):Utterance=>({text,language,label,...extra});

/** The conversation as it is played: a line is heard once none of its own gaps is open (see the scene view). */
function sceneUtterances(modules:Module[],s:Session,language:string):Utterance[]|undefined{
 const view=sceneView(modules,s);if(!view)return;
 const whole=s.boardSummary===true,found:Utterance[]=[];let gap=0;
 for(const [index,line] of view.scene.lines.entries()){
  const first=gap;gap+=line.text.split('___').length-1;
  if(whole||gap<=view.position){
   let spoken=first;
   try{found.push(voice(line.text.replace(/___/g,()=>questionFor(modules,view.items[spoken++]).answers[0]),language,`Kwestia ${index+1} · ${line.speaker}`,{line:index+1,speaker:line.speaker}));}catch{/* a broken gap has nothing to say */}
  }
  if(!whole&&gap>view.position)break;
 }
 return found;
}

/** Sentences of a reading that are on screen; `shown` is the screen's own counter. */
export function readingReportable(modules:Module[],s:Session,shown?:number):Utterance[]{
 const view=readingView(modules,s,shown);if(!view)return [];
 const language=view.module.languageCode;if(!language)return [];
 return view.reading.sentences.slice(0,view.visible).map((sentence,index)=>voice(sentence.text,language,`Zdanie ${index+1}`,{line:index+1}));
}

/** Every utterance the screen offers, whether or not this device can play it right now. */
export function screenUtterances(modules:Module[],s:Session,shown?:number):Utterance[]{
 const item=s.items[s.index];if(!item)return [];
 const language=modules.find(m=>m.id===item.moduleId)?.languageCode;if(!language)return [];
 const scene=sceneUtterances(modules,s,language);if(scene)return scene;
 if(readingView(modules,s,shown))return readingReportable(modules,s,shown);
 if(s.boardSummary)return [];
 const task=listeningTask(modules,item)??(s.phase==='feedback'&&['flashcards','flashcards-basic','quiz'].includes(s.mode)?vocabularyPlayback(modules,item):undefined);
 return task?[voice(task.text,task.language,'Nagranie w zadaniu')]:[];
}

export interface ReportableEnvironment{
 canSpeak:(language:string,text:string)=>boolean;
 recordingOf:(text:string,language:string)=>string|undefined;
 last:PlaybackRecord|undefined;
}
/**
 * The utterances offered in the sound questions: those this device can play, plus the one
 * the learner just tried (even when it failed and the task has already turned into its
 * ordinary form). Known facts are attached; unknown ones stay absent.
 */
export function reportableUtterances(all:Utterance[],env:ReportableEnvironment):{list:Utterance[];lastIndex?:number}{
 const same=(u:Utterance)=>!!env.last&&speechKey(u.text,u.language)===speechKey(env.last.text,env.last.language);
 const list=all.filter(u=>same(u)||env.canSpeak(u.language,u.text)).map(u=>{
  const file=env.last&&same(u)&&env.last.recordingFile?env.last.recordingFile:env.recordingOf(u.text,u.language);
  return {...u,...(file?{recordingFile:file}:{}),...(same(u)?{playback:env.last!.via,...(env.last!.recordingFailed?{recordingFailed:true as const}:{})}:{})};
 });
 const lastIndex=list.findIndex(same);
 return lastIndex>=0?{list,lastIndex}:{list};
}

/** What to do after a category was chosen — decided here, carried out by the controller. */
export type CategoryPlan={kind:'ask-comment'}|{kind:'ask-utterance'}|{kind:'send';utterance?:number};
export function planCategory(category:ReportCategory,utterances:number,lastIndex:number|undefined):CategoryPlan{
 if(category==='other')return {kind:'ask-comment'};
 if(!isAudioCategory(category)||utterances===0)return {kind:'send'};
 if(utterances===1)return {kind:'send',utterance:0};
 void lastIndex;
 return {kind:'ask-utterance'};
}

/** Where the report is from; enough for the maintainer to find the exact item. */
export interface ReportSubject{course?:string;module:string;item:string;excerpt:string}
export function reportSubject(modules:Module[],s:Session):ReportSubject|undefined{
 const item=s.items[s.index];if(!item)return;
 const module=modules.find(m=>m.id===item.moduleId);
 let prompt='';try{prompt=questionFor(modules,item).prompt;}catch{/* the item itself is the clue */}
 return {...(module?.courseId?{course:module.courseId}:{}),module:item.moduleId,item:item.key,excerpt:clip(prompt,limits.excerpt)};
}

export interface ReportAudio{text:string;language:string;line?:number;speaker?:string;recordingFile?:string;playback?:PlaybackVia;recordingFailed?:true}
export interface ProblemReport{id:string;createdAt:string;category:ReportCategory;comment?:string;course?:string;module:string;item:string;excerpt:string;audio?:ReportAudio}
export interface ReportInput{id:string;now:Date;category:ReportCategory;comment?:string;subject:ReportSubject;utterance?:Utterance}

export function buildReport({id,now,category,comment,subject,utterance}:ReportInput):ProblemReport{
 const note=comment?clip(comment,limits.comment):'';
 return {id,createdAt:now.toISOString(),category,...(note?{comment:note}:{}),...(subject.course?{course:subject.course}:{}),module:subject.module,item:subject.item,excerpt:clip(subject.excerpt,limits.excerpt),
  ...(utterance&&isAudioCategory(category)?{audio:{text:clip(utterance.text,limits.text),language:utterance.language,...(utterance.line!==undefined?{line:utterance.line}:{}),...(utterance.speaker?{speaker:utterance.speaker}:{}),
   ...(utterance.recordingFile?{recordingFile:utterance.recordingFile}:{}),...(utterance.playback?{playback:utterance.playback}:{}),...(utterance.recordingFailed?{recordingFailed:true as const}:{})}}:{})};
}

/** The Firestore document of one report (collection `zgloszenia`). The field list must match `firestore.rules`. */
export type ReportDocument=Omit<ProblemReport,'id'|'createdAt'>&{format:1;uid:string;createdAt:Date};
export function reportDocument({id:_id,createdAt,...rest}:ProblemReport,uid:string):ReportDocument{
 return {format:1,uid,createdAt:new Date(createdAt),...rest};
}

const text=(value:unknown,max:number)=>typeof value==='string'&&value.length<=max;
const plain=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
function validReport(value:unknown):value is ProblemReport{
 if(!plain(value))return false;
 const {id,createdAt,category,comment,course,module,item,excerpt,audio}=value;
 if(typeof id!=='string'||!/^[a-f0-9]{32}$/.test(id)||typeof createdAt!=='string'||Number.isNaN(Date.parse(createdAt)))return false;
 if(!reportCategories.includes(category as ReportCategory)||!text(module,200)||!text(item,300)||!text(excerpt,limits.excerpt))return false;
 if(module===''||item==='')return false;
 if(comment!==undefined&&(typeof comment!=='string'||comment===''||comment.length>limits.comment))return false;
 if(course!==undefined&&(typeof course!=='string'||course===''||course.length>200))return false;
 if(audio!==undefined){
  if(!plain(audio)||!text(audio.text,limits.text)||audio.text===''||typeof audio.language!=='string'||!/^\w+(?:[-_]\w+)*$/.test(audio.language))return false;
  if(audio.line!==undefined&&!(Number.isInteger(audio.line)&&(audio.line as number)>0&&(audio.line as number)<1000))return false;
  if(audio.speaker!==undefined&&!text(audio.speaker,100))return false;
  if(audio.recordingFile!==undefined&&!(typeof audio.recordingFile==='string'&&/^clips\/[a-f0-9]{64}\.ogg$/.test(audio.recordingFile)))return false;
  if(audio.playback!==undefined&&!['recording','device-voice','none'].includes(audio.playback as string))return false;
  if(audio.recordingFailed!==undefined&&audio.recordingFailed!==true)return false;
 }
 return true;
}
/** The queue read back from this device: damaged entries are dropped, the rest is kept. */
export function parseReports(value:unknown):ProblemReport[]{return Array.isArray(value)?value.filter(validReport):[];}

/** What the learner sees on screen: one report being made, never saved with the progress. */
export interface ReportDraft{
 id:string;subject:ReportSubject;utterances:Utterance[];lastIndex?:number;
 step:'category'|'which'|'comment'|'sending'|'done';
 category?:ReportCategory;problem?:string;outcome?:ReportOutcome;
}
export type ReportOutcome='sent'|'waiting-login'|'waiting-offline'|'waiting-error';
export const outcomeText:Record<ReportOutcome,string>={
 sent:'Wysłano. Dziękujemy!',
 'waiting-login':'Zapisane na tym urządzeniu. Wyślemy je, gdy zalogujesz się na konto.',
 'waiting-offline':'Brak internetu. Zgłoszenie czeka na tym urządzeniu i wyślemy je, gdy połączenie wróci.',
 'waiting-error':'Nie udało się wysłać teraz. Zgłoszenie czeka na tym urządzeniu i spróbujemy jeszcze raz.',
};
