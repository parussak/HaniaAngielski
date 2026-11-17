// Logika kontroli jakości nagrań: porównanie tekstu z rozpoznaniem mowy, pomiary próbek i raport.
// Czyste funkcje bez plików i narzędzi — testowane w tests/audio-verify.test.ts.

/** Progi podejrzenia. Opis i uzasadnienie: docs/generowanie-audio.md, sekcja „Kontrola brzmienia”. */
export const thresholds=Object.freeze({
 difference:0.25,      // >25% znaków różnicy między tekstem a tym, co usłyszał Whisper
 wordDifference:0.5,   // albo połowa słów inna przy co najmniej 12,5% różnicy znaków („sandwich” → „sad wish”)
 confidence:0.45,      // średnia pewność Whispera poniżej — dźwięk może być niewyraźny
 slowPace:1.8,         // nagranie o 80% dłuższe niż typowe dla tej długości tekstu
 fastPace:0.55,        // nagranie wyraźnie krótsze — może być ucięte lub połknięte
 pauseSeconds:0.8,     // najdłuższa cisza w środku nagrania
 voicedRatio:0.35,     // mowa w mniej niż 35% nagrania (krótkie słowa ze spółgłoskami zwartymi mają ok. 45%)
 clippedSamples:3,     // więcej próbek na granicy skali = przesterowanie
 silenceDb:-45,        // okno 20 ms ciszej niż to jest ciszą (nagrania są wyrównane do -18 LUFS)
});

const numbers=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'];
const spelling={ok:'okay',mr:'mister',mrs:'missus'};
const articles=new Set(['a','an','the']);

/** Słowa do porównania: małe litery, bez interpunkcji i apostrofów, liczby 0–20 słownie. */
export function normalizeWords(text){
 return String(text??'').normalize('NFC').toLowerCase().replace(/[’‘`]/g,"'").replace(/'/g,'').replace(/[-‐–—/]/g,' ')
  .replace(/[^\p{L}\p{N}\s]/gu,' ').split(/\s+/).filter(Boolean)
  .map(w=>/^\d+$/.test(w)&&Number(w)<numbers.length?numbers[Number(w)]:spelling[w]??w);
}

export function editDistance(a,b){
 let prev=Array.from({length:b.length+1},(_,i)=>i);
 for(let i=1;i<=a.length;i++){
  const row=[i];
  for(let j=1;j<=b.length;j++)row[j]=Math.min(prev[j]+1,row[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
  prev=row;
 }
 return prev[b.length];
}
const ratio=(distance,length)=>length?Math.min(1,distance/length):(distance?1:0);
function measure(expected,heard){
 const e=expected.join(''),h=heard.join('');
 return {characters:ratio(editDistance([...e],[...h]),[...e].length),words:ratio(editDistance(expected,heard),expected.length)};
}
const withoutArticle=words=>articles.has(words[0])&&words.length>1?words.slice(1):words;

/**
 * Porównuje tekst nagrania z rozpoznaniem. Miarą jest odsetek zmienionych znaków po normalizacji
 * i bez spacji („milk shake” = „milkshake”). Różnica tylko w początkowym rodzajniku
 * jest odnotowana osobno, bo Whisper często go gubi w pojedynczych słówkach.
 */
export function compareTexts(expectedText,heardText){
 const expected=normalizeWords(expectedText),heard=normalizeWords(heardText);
 const full=measure(expected,heard),bare=measure(withoutArticle(expected),withoutArticle(heard));
 const articleOnly=full.characters>0&&bare.characters===0;
 return {expected:expected.join(' '),heard:heard.join(' '),difference:articleOnly?0:full.characters,wordDifference:articleOnly?0:full.words,articleOnly};
}

/** Pomiary z próbek 16-bit mono: czas, cisza, przesterowanie. */
export function analyzeSamples(samples,sampleRate,{silenceDb=thresholds.silenceDb}={}){
 const window=Math.max(1,Math.round(sampleRate*0.02)),limit=32767*10**(silenceDb/20),voiced=[];
 let peak=0,clipped=0;
 for(let i=0;i<samples.length;i++){const v=Math.abs(samples[i]);if(v>peak)peak=v;if(v>=32766)clipped++;}
 for(let start=0;start<samples.length;start+=window){
  let sum=0;const end=Math.min(samples.length,start+window);
  for(let i=start;i<end;i++)sum+=samples[i]*samples[i];
  voiced.push(Math.sqrt(sum/(end-start))>=limit);
 }
 const first=voiced.indexOf(true),last=voiced.lastIndexOf(true),step=window/sampleRate;
 let longest=0,run=0;
 for(let i=first;i>=0&&i<=last;i++){if(voiced[i])run=0;else longest=Math.max(longest,++run);}
 const round=v=>Math.round(v*1000)/1000;
 return {
  durationSeconds:round(samples.length/sampleRate),
  peakDb:peak?Math.round(200*Math.log10(peak/32767))/10:-Infinity,
  clippedSamples:clipped,
  longestPauseSeconds:round(longest*step),
  voicedRatio:voiced.length?round(voiced.filter(Boolean).length/voiced.length):0,
 };
}

const letters=text=>normalizeWords(text).join('').length;
// Krótkie słówka mają stały narzut (oddech, wybrzmienie), więc do liczby liter dodajemy 4.
const paceUnit=clip=>clip.measurements.durationSeconds/(letters(clip.text)+4);
const median=values=>{const s=[...values].sort((a,b)=>a-b);return s.length?(s.length%2?s[(s.length-1)/2]:(s[s.length/2-1]+s[s.length/2])/2):0;};

/**
 * Ocena wszystkich klipów. Wejście: {id, text, keys, file, measurements, heard?, confidence?}.
 * `heard` undefined = rozpoznawanie pominięte. Tempo jest liczone względem mediany tego zestawu.
 */
export function assessClips(clips,limits=thresholds){
 const typical=median(clips.filter(c=>c.measurements?.durationSeconds>0).map(paceUnit));
 return clips.map(clip=>{
  const reasons=[],notes=[],m=clip.measurements;let score=0;
  let comparison=null;
  if(clip.heard!==undefined){
   comparison=compareTexts(clip.text,clip.heard);
   if(!comparison.heard){reasons.push('Whisper nic nie rozpoznał');score+=1.5;}
   else if(comparison.difference>limits.difference||comparison.wordDifference>=limits.wordDifference&&comparison.difference>=limits.difference/2){reasons.push(`inny tekst (${Math.round(comparison.difference*100)}% znaków, ${Math.round(comparison.wordDifference*100)}% słów)`);score+=Math.max(comparison.difference,limits.difference);}
   if(comparison.articleOnly)notes.push('różni się tylko rodzajnik');
   if(Number.isFinite(clip.confidence)&&clip.confidence<limits.confidence&&comparison.heard){reasons.push(`niska pewność rozpoznania (${Math.round(clip.confidence*100)}%)`);score+=0.3;}
  }
  const pace=typical&&m?.durationSeconds?Math.round(paceUnit(clip)/typical*100)/100:null;
  if(pace!==null&&pace>limits.slowPace){reasons.push(`za długie (${pace}× typowego tempa)`);score+=0.5;}
  if(pace!==null&&pace<limits.fastPace){reasons.push(`za krótkie (${pace}× typowego tempa)`);score+=0.5;}
  if(m?.longestPauseSeconds>limits.pauseSeconds){reasons.push(`długa cisza w środku (${m.longestPauseSeconds} s)`);score+=0.5;}
  if(m&&m.voicedRatio<limits.voicedRatio){reasons.push(`mało mowy (${Math.round(m.voicedRatio*100)}% nagrania)`);score+=0.5;}
  if(m?.clippedSamples>limits.clippedSamples){reasons.push(`przesterowanie (${m.clippedSamples} próbek)`);score+=0.5;}
  return {...clip,comparison,pace,reasons,notes,score:Math.round(score*100)/100,suspect:reasons.length>0};
 }).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
}

const quote=text=>`„${text}”`;
function entry(c,index){
 const keys=c.keys.length>1?`${c.keys[0]} (+${c.keys.length-1})`:c.keys[0]??'';
 const m=c.measurements,lines=[`${index}. ${keys} — ${c.reasons.concat(c.notes).join('; ')}`,`   oczekiwane: ${quote(c.text)}`];
 if(c.heard!==undefined)lines.push(`   usłyszane:  ${quote(c.heard.trim())}${Number.isFinite(c.confidence)?` (pewność ${Math.round(c.confidence*100)}%)`:''}`);
 if(m)lines.push(`   pomiary: ${m.durationSeconds} s, tempo ${c.pace??'?'}×, pauza ${m.longestPauseSeconds} s, mowa ${Math.round(m.voicedRatio*100)}%, szczyt ${m.peakDb} dBFS`);
 lines.push(`   plik: ${c.file}`);
 return lines.join('\n');
}

/** Krótki raport tekstowy (Markdown), od najgorszych. */
export function formatReport(assessed,{model,recognition=true,date=new Date().toISOString().slice(0,10)}={}){
 const suspects=assessed.filter(c=>c.suspect),articles=assessed.filter(c=>!c.suspect&&c.notes.length);
 const out=[`# Kontrola nagrań — ${date}`,'',
  `Sprawdzono ${assessed.length} klipów. Podejrzane: **${suspects.length}**. Tylko rodzajnik do odsłuchu: ${articles.length}.`,
  recognition?`Rozpoznawanie: ${model}. Próg różnicy tekstu: ${Math.round(thresholds.difference*100)}% znaków.`:'Rozpoznawanie mowy pominięte — tylko pomiary czasu, ciszy i przesterowania.',
  'Decyzja dla każdego podejrzanego: wygenerować ponownie, zmienić tekst albo zostawić (po odsłuchu).',''];
 if(suspects.length){out.push('## Podejrzane',...suspects.map((c,i)=>entry(c,i+1)),'');}
 else out.push('Brak podejrzanych nagrań.','');
 if(articles.length){out.push('## Do odsłuchu: rodzajnik',...articles.map(c=>`- ${c.keys[0]}: oczekiwane ${quote(c.text)}, usłyszane ${quote(c.heard.trim())}`),'');}
 out.push('Ograniczenia: Whisper bywa niedokładny przy pojedynczych słowach i rodzajnikach; dobre rozpoznanie nie gwarantuje ładnego brzmienia. Raport wskazuje, co odsłuchać — nie zastępuje odsłuchu.');
 return out.join('\n')+'\n';
}

/** Średnia pewność tokenów tekstowych z pełnego JSON-u whisper-cli (-ojf). */
export function readWhisperJson(json){
 const segments=json?.transcription??[];
 const text=segments.map(s=>s.text??'').join('').replace(/\s+/g,' ').trim();
 const probabilities=segments.flatMap(s=>s.tokens??[]).filter(t=>typeof t.p==='number'&&!/^\[_|^<\|/.test(t.text??'')&&(t.text??'').trim()).map(t=>t.p);
 return {heard:text,confidence:probabilities.length?Math.round(probabilities.reduce((a,b)=>a+b,0)/probabilities.length*1000)/1000:undefined};
}

/** Nagłówek WAV PCM 16-bit mono dla Whispera. */
export function wavFile(samples,sampleRate){
 const data=Buffer.from(samples.buffer,samples.byteOffset,samples.byteLength),header=Buffer.alloc(44);
 header.write('RIFF',0);header.writeUInt32LE(36+data.length,4);header.write('WAVE',8);header.write('fmt ',12);
 header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(sampleRate,24);
 header.writeUInt32LE(sampleRate*2,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(data.length,40);
 return Buffer.concat([header,data]);
}
