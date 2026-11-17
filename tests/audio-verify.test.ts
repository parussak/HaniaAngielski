import {test} from 'node:test';
import assert from 'node:assert/strict';
import {analyzeSamples,assessClips,compareTexts,formatReport,normalizeWords,readWhisperJson,wavFile} from '../scripts/audio/verify-core.mjs';

// Dane syntetyczne: bez Whispera i bez prawdziwych nagrań.
const rate=16000;
function signal(parts:Array<[number,number]>){ // [sekundy, amplituda]; 0 = cisza
 const out:number[]=[];
 for(const [seconds,amp] of parts)for(let i=0;i<Math.round(seconds*rate);i++)out.push(Math.max(-32768,Math.min(32767,Math.round(amp*Math.sin(i/5)))));
 return Int16Array.from(out);
}
const speech=(seconds:number)=>signal([[seconds,8000]]);
const clip=(id:string,text:string,heard:string|undefined,seconds:number,extra={})=>({id,text,keys:[`m:word:${id}`],file:`audio/generated/clips/${id}.ogg`,heard,confidence:0.9,measurements:analyzeSamples(speech(seconds),rate),...extra});

test('normalizacja pomija wielkość liter, interpunkcję i apostrofy, liczby zamienia na słowa', () => {
 assert.deepEqual(normalizeWords("I'd like 2 Apples, please!"),['id','like','two','apples','please']);
 assert.deepEqual(normalizeWords('ice-cream'),normalizeWords('ice cream'));
 assert.equal(compareTexts('Anything else?','anything else.').difference,0);
 assert.equal(compareTexts('a strawberry milkshake','A strawberry milk shake').difference,0);
});

test('różnica tylko w początkowym rodzajniku jest notatką, a nie podejrzeniem', () => {
 const article=compareTexts('an apple','Apple.');
 assert.equal(article.articleOnly,true);
 assert.equal(article.difference,0);
 const [result]=assessClips([clip('a','an apple','Apple.',0.9)]);
 assert.equal(result.suspect,false);
 assert.deepEqual(result.notes,['różni się tylko rodzajnik']);
 assert.equal(compareTexts('a bottle of water','a bottle of whatever').articleOnly,false);
});

test('inny tekst ponad próg i pusta transkrypcja są podejrzane, drobna literówka nie', () => {
 assert.ok(compareTexts('biscuit','basket').difference>0.25);
 const results=assessClips([
  clip('ok','a bottle of water','A bottle of water.',1.6),
  clip('typo','beautiful','Beautifull.',1.0),
  clip('wrong','a biscuit','A basket.',1.0),
  clip('empty','a jar of jam','',1.3),
 ]);
 const byId=Object.fromEntries(results.map(r=>[r.id,r]));
 assert.equal(byId.ok.suspect,false);
 assert.equal(byId.typo.suspect,false);
 assert.match(byId.wrong.reasons[0],/inny tekst/);
 assert.match(byId.empty.reasons[0],/nic nie rozpoznał/);
 assert.equal(results[0].id,'empty','najgorsze na początku');
});

test('pomiary wykrywają długą ciszę w środku, przesterowanie i mało mowy', () => {
 const pause=analyzeSamples(signal([[0.3,8000],[1.2,0],[0.3,8000]]),rate);
 assert.ok(pause.longestPauseSeconds>=1.1&&pause.longestPauseSeconds<=1.3);
 assert.ok(pause.voicedRatio<0.35);
 const loud=analyzeSamples(signal([[0.5,40000]]),rate);
 assert.ok(loud.clippedSamples>3);
 const clean=analyzeSamples(speech(1),rate);
 assert.equal(clean.clippedSamples,0);
 assert.equal(clean.longestPauseSeconds,0);
 assert.equal(clean.durationSeconds,1);
 const [result]=assessClips([{...clip('p','a cake','A cake.',1),measurements:pause}]);
 assert.ok(result.reasons.some(r=>/długa cisza/.test(r))&&result.reasons.some(r=>/mało mowy/.test(r)));
});

test('tempo jest liczone względem typowego tempa zestawu', () => {
 const set=['an apple','a banana','a lemon','an orange','a carrot'].map((t,i)=>clip(`c${i}`,t,t,0.9));
 set.push(clip('slow','a pear','a pear',3.5),clip('fast','a bottle of orange juice','a bottle of orange juice',0.4));
 const byId=Object.fromEntries(assessClips(set).map(r=>[r.id,r]));
 assert.match(byId.slow.reasons.join(),/za długie/);
 assert.match(byId.fast.reasons.join(),/za krótkie/);
 assert.equal(byId.c0.suspect,false);
});

test('raport jest krótki, posortowany i zawiera tekst oczekiwany, usłyszany oraz plik', () => {
 const report=formatReport(assessClips([
  clip('good','a cake','A cake.',0.9),
  clip('bad','a sandwich','A sad wish.',1.1),
  clip('article','an egg','Egg.',0.8),
 ]),{model:'test-model',date:'2026-11-16'});
 assert.match(report,/Podejrzane: \*\*1\*\*/);
 assert.match(report,/oczekiwane: „a sandwich”/);
 assert.match(report,/usłyszane: {2}„A sad wish\.”/);
 assert.match(report,/audio\/generated\/clips\/bad\.ogg/);
 assert.match(report,/## Do odsłuchu: rodzajnik\n- m:word:article/);
 assert.doesNotMatch(report,/clips\/good\.ogg/);
 assert.match(formatReport(assessClips([clip('x','a cake',undefined,0.9)]),{recognition:false}),/Rozpoznawanie mowy pominięte/);
});

test('odczyt JSON whisper-cli łączy segmenty i pomija tokeny specjalne', () => {
 const result=readWhisperJson({transcription:[{text:' A bottle',tokens:[{text:'[_BEG_]',p:0.1},{text:' A',p:0.9},{text:' bottle',p:0.7}]},{text:' of water.',tokens:[{text:' of',p:0.8},{text:' water',p:0.6},{text:'[_TT_50]',p:0.2}]}]});
 assert.equal(result.heard,'A bottle of water.');
 assert.equal(result.confidence,0.75);
 assert.deepEqual(readWhisperJson({transcription:[]}),{heard:'',confidence:undefined});
});

test('WAV ma poprawny nagłówek PCM 16-bit mono', () => {
 const wav=wavFile(Int16Array.from([1,-1,2]),rate);
 assert.equal(wav.toString('ascii',0,4),'RIFF');
 assert.equal(wav.readUInt32LE(24),rate);
 assert.equal(wav.readUInt32LE(40),6);
 assert.equal(wav.length,50);
});
