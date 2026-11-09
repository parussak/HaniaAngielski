import {homeView} from './home-view.ts';
import {getNextStep} from './next-step.ts';
import {journeyList as renderJourneyList,moduleList as renderModuleList} from './catalog-view.ts';
import {labels} from './learning-labels.ts';
import {e,icon,button} from './ui.ts';
import {loadCats,responseCat,endingCat,type CatCatalog,type CatReaction} from './cats.ts';
import {closestAnswer,type AnswerPart} from './answer-comparison.ts';
import {pwa,startPwa,installPwa,prepareOffline,applyUpdate} from './pwa.ts';
import './style.css';
import './theme.css';
import './adventure.css';
import './home.css';
import {loadJourneys,lessons,stars,unlocked,makeLessonSession,rewardCompletion,purchase,place,type Journey} from './adventure.ts';
import {journeyView,lessonIntro,houseView} from './adventure-view.ts';
import {seedStageReviews,seedReviewArchive,recordStageError,makeStageReviewSession,finishStageReview,settleStageRewards,reviewState,reviewStats,pendingLabel,stageForSession} from './stage-review.ts';
import {compactHistory,checkPage,sessionCount,type HistoryPage} from './history.ts';
import {fullBackup,validateFullBackup} from './history-backup.ts';
import {localHistoryPage,putHistoryPage} from './storage.ts';
import { loadModules } from './content.ts';
import { isFlashcardMode, inputFor, currentStats, optionsFor, backup, emptyProgress, makeSession, questionFor, next, recordAnswer, score, sessionCompatible, validateBackup, type Exercise, type Illustration, type AnswerMode, type Mode, type Module, type Progress, type Session, type Backup } from './core.ts';
import {firebaseMessage} from './firebase-errors.ts';
import {ProgressSync,hasProgress,type AccountCache} from './sync.ts';
import type {AccountUser} from './firebase.ts';
import { load, save, readStored, writeStored, storageNamespace } from './storage.ts';

let modules: Module[] = [];
let catCatalog: CatCatalog|null=null;
const root = document.querySelector<HTMLDivElement>('#app')!;
let progress: Progress = emptyProgress();
let screen: 'home' | 'setup' | 'study' | 'progress' | 'backup' | 'account' | 'summary' | 'map' | 'lesson-intro' | 'house' | 'journeys' | 'module-list' = 'home';
let journeys:Journey[]=[];
let introLessonId='';
let chosenDecoration='pillow';
let lastReward=0;
let lastStageReward=0;
let reviewMigrationTimer:ReturnType<typeof setTimeout>|undefined;
let reviewMigrationWorking=false;
let olderSessions:Session[]=[];
let olderHead:string|null|undefined;
let viewedHistory='';
let selected: Module;
let mode: Mode = 'flashcards-basic';
let answerMode: AnswerMode = 'mixed';
let previous = false;
let pending: Backup | null = null;
let notice = '';
let storageError = '';
let busy = false;
let ready = false;
let lastSession: Session | null = null;
let renderedScreen = '';
let user: AccountUser | null=null;
let guestProgress=emptyProgress();
let accountError='';
let accountNotice='';
let registerAccount=false;
let accountSection='name';
let authWorking=false;
let reauthNeeded=false;
let syncTimer: ReturnType<typeof setTimeout> | undefined;
let firebaseSDK: Promise<typeof import('./firebase.ts')> | undefined;
const sdk=()=>firebaseSDK??=import('./firebase.ts').catch(error=>{firebaseSDK=undefined;throw error;});
async function deadline<T>(operation:Promise<T>):Promise<T> {
  let timer:ReturnType<typeof setTimeout>;
  try{return await Promise.race([operation,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('Połączenie trwa zbyt długo. Postępy pozostają na tym urządzeniu.')),12000);})]);}
  finally{clearTimeout(timer!);}
}
const sync=new ProgressSync({
  prepare:prepareProgress,
  read:uid=>readStored<AccountCache>(`account:${uid}`),
  save:(uid,cache)=>writeStored(`account:${uid}`,cache),
  fetch:async uid=>deadline((await sdk()).fetchProgress(uid)),
  push:async(uid,p,revision)=>deadline((await sdk()).pushProgress(uid,p,revision)),
},dataChanged=>{
  if(dataChanged && sync.cache){progress=structuredClone(sync.cache.progress);lastSession=null;}
  if(dataChanged)scheduleReviewMigration();
  if(sync.status==='saved' && !reauthNeeded)accountError='';
  if(!ready || busy)return;
  if(screen==='account' && document.activeElement?.closest('form')){refreshSyncLabel();return;}
  if(dataChanged || screen==='account')render();else refreshSyncLabel();
});
function syncLabel(){return !user || !navigator.onLine?'Zapis lokalny':sync.status==='saved'?'Zapis na koncie':sync.status==='checking'?'Łączenie…':sync.status==='conflict'?'Sprawdź zapis':'Zapis lokalny';}
function refreshSyncLabel(){root.querySelectorAll('[data-sync-label]').forEach(el=>el.textContent=storageError?'Problem z zapisem':syncLabel());}
function scheduleSync(delay=1200){
  clearTimeout(syncTimer);
  if(!user || sync.conflict || reauthNeeded)return;
  if(!navigator.onLine){if(sync.cache?.dirty)sync.status='pending';refreshSyncLabel();return;}
  syncTimer=setTimeout(async()=>{
    if(busy || authWorking){scheduleSync(500);return;}
    await sync.sync();
    if(sync.status==='pending')scheduleSync();
  },delay);
}
async function connectAccount(account: AccountUser){
  await sync.connect(account.uid,guestProgress);
  user={uid:account.uid,email:account.email,displayName:account.displayName??null};reauthNeeded=false;
  await writeStored('firebase-user',user);
  screen='account';accountSection='name';registerAccount=false;progress=structuredClone(sync.cache!.progress);pending=null;lastSession=null;
  scheduleSync(0);
}
const date = (value: string) => new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
function compatible() { return !progress.active || sessionCompatible(modules, progress.active); }
function stats() { return currentStats(modules,progress); }
async function prepareProgress(p:Progress){
  const prepared=await compactHistory(seedStageReviews(p,journeys),putHistoryPage);
  settleStageRewards(prepared,journeys);return prepared;
}
function scheduleReviewMigration(){
  if(!ready||!progress.adventure?.reviewArchiveHead||reviewMigrationWorking)return;
  clearTimeout(reviewMigrationTimer);
  reviewMigrationTimer=setTimeout(async()=>{
    if(busy){scheduleReviewMigration();return;}
    const head=progress.adventure?.reviewArchiveHead,owner=user?.uid??'guest';if(!head)return;
    reviewMigrationWorking=true;let again=false;
    try{
      const page=await getHistoryPage(head);
      if((user?.uid??'guest')!==owner||progress.adventure?.reviewArchiveHead!==head)return;
      if(busy){again=true;return;}
      await run(async()=>{
        const earned=progress.adventure?.earned??0;
        await mutate(p=>{seedReviewArchive(p,page,journeys);});
        if((progress.adventure?.earned??0)>earned)notice='Dawne lekcje uwzględnione. Gwiazdki za domknięte etapy są już w portfelu.';
      });again=true;
    }catch{
      if((screen==='map'||screen==='journeys')&&(user?.uid??'guest')===owner){notice='Starsze błędy doliczymy po pobraniu historii. Połącz się z internetem; bieżące ćwiczenia i zapis działają.';render();}
    }finally{reviewMigrationWorking=false;if(again||(user?.uid??'guest')!==owner||progress.adventure?.reviewArchiveHead!==head)scheduleReviewMigration();}
  },300);
}
function currentJourney(){return journeys.find(j=>j.moduleId===selected?.id)??journeys[0];}
function decorativeCat(id:string){
  const cat=catCatalog?.cats.find(c=>c.id===id);
  return cat?catView({cat,mood:'happy',frame:cat.happy}):icon('cat');
}
function mapView(){const j=currentJourney();return j?journeyView(j,progress,decorativeCat):'<h1>Kocia mapa</h1><p>Mapa jest chwilowo niedostępna. Twoje własne ćwiczenia nadal działają.</p>'+button('home','Moja nauka');}
function introView(){const j=currentJourney(),l=j&&lessons(j).find(l=>l.lesson.id===introLessonId)?.lesson,m=modules.find(m=>m.id===j?.moduleId);return j&&l&&m?lessonIntro(j,l,m,progress):mapView();}
function homeForCats(){const j=currentJourney(),complete=!!j&&lessons(j).every(l=>progress.adventure?.completed[l.key]);return houseView(progress,chosenDecoration,decorativeCat,complete);}
async function getHistoryPage(id:string):Promise<HistoryPage>{
  const local=await localHistoryPage(id);if(local)return checkPage(local);
  if(!user || !navigator.onLine)throw new Error('Ta część historii nie jest jeszcze pobrana. Połącz się z internetem i otwórz ją lub zapisz pełną kopię. Bieżące wyniki są bezpieczne.');
  return deadline((await sdk()).fetchHistoryPage(user.uid,id));
}
function shell(content: string) {
  const active = screen === 'house' ? 'house' : screen === 'progress' ? 'progress' : screen === 'backup' || screen === 'account' ? 'backup' : 'home';
  return `<aside class="sidebar"><a class="brand" href="#" data-action="home"><span class="brand-icon">${icon('cat')}</span><span>małe kroki<span class="brand-sub">PRZESTRZEŃ DO NAUKI</span></span></a><button type="button" class="profile" data-action="account" aria-label="Ustawienia konta"><span class="avatar">${e(Array.from(user?.displayName||'Hania')[0].toLocaleUpperCase())}</span><span class="profile-details"><strong>${e(user ? user.displayName||'Twoje konto' : 'Hania')}</strong><span>Ustawienia konta →</span></span><span class="tiny-flower" aria-hidden="true">⚙</span></button><span class="nav-label">TWOJA PRZESTRZEŃ</span><nav aria-label="Główna nawigacja">${[['home','home','Moja nauka'],['house','cat','Domek'],['progress','chart','Moje postępy'],['backup','cloud','Kopia postępów']].map(([action,i,label]) => `<button class="nav-item ${active === action ? 'active' : ''}" data-action="${action}" aria-label="${label}" ${active === action ? 'aria-current="page"' : ''}>${icon(i)}<span class="nav-label-full">${label}</span><span class="nav-label-short">${({home:'Nauka',house:'Domek',progress:'Postępy',backup:'Kopia'} as Record<string,string>)[action]}</span>${active === action ? '<span class="nav-dot"></span>' : ''}</button>`).join('')}</nav><div class="sidebar-note"><span>✦</span><strong>Po trochu, każdego dnia.</strong><p>Każda próba to mały krok do przodu.</p></div><div class="local-note">${icon('check')} Postępy na tym urządzeniu<span>${user ? 'Połączono z kontem.' : 'Możesz połączyć z kontem.'}</span></div></aside><main><header class="topbar"><span>NAUKA JĘZYKA / <b>${screen === 'backup' ? 'KOPIA POSTĘPÓW' : screen === 'progress' ? 'POSTĘPY' : 'MOJA NAUKA'}</b></span><button class="local-chip" data-action="account" aria-label="Konto i synchronizacja"><span></span><span data-sync-label>${storageError ? 'Problem z zapisem' : syncLabel()}</span></button></header>${storageError ? `<div class="alert error" role="alert">${e(storageError)}</div>` : ''}${notice ? `<div class="alert" role="status">${e(notice)}</div>` : ''}<div class="content">${content}</div><footer>Stworzone do nauki, bez pośpiechu. <span>Małe kroki, wielkie odkrycia ✦</span></footer></main>`;
}
function home(){
  const step=getNextStep(modules,journeys,progress);
  return homeView({name:user?user.displayName:'Haniu',modules,step,pwa,cat:decorativeCat(step.catId)});
}
function journeyList(){return renderJourneyList(modules,journeys,progress);}
function moduleList(){return renderModuleList(modules);}
function setup() {
  const descriptions: Record<Mode,string> = { 'flashcards-basic': `${selected.basicFlashcardIds?.length ?? selected.words.length} haseł z ramek Vocabulary. Dobry zestaw na początek.`, flashcards: `Wszystkie ${selected.words.length} haseł z modułu, także dodatkowe słówka i zwroty.`, quiz: 'Sprawdź słówka w krótkich pytaniach.', grammar: 'Buduj zdania, próbuj i poznawaj zasady.', dialogue: 'Uzupełniaj krótkie dialogi o jedzeniu, napojach i zakupach.', review: 'Wróć do zadań, które sprawiły trudność.', lesson: 'Lekcje na kociej mapie.' };
  return `<button class="back" data-action="module-list">← Twoje moduły</button><div class="eyebrow">MODUŁ ${selected.order} · ${e(selected.label)}</div><h1>${e(selected.name)}</h1><p class="lead">Wybierz sposób odpowiedzi, potem dotknij kafelka i ćwicz.</p><section class="panel"><fieldset><legend>Sposób odpowiadania</legend><div class="segmented">${([['choice','Wybieram odpowiedź'],['text','Wpisuję odpowiedź'],['mixed','Trochę wybieram, trochę wpisuję']] as const).map(([v,l]) => `<label><input type="radio" name="answerMode" value="${v}" ${answerMode === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></fieldset>${progress.active ? `<div class="alert">Masz rozpoczętą sesję.${compatible() ? button('resume','Wróć do rozpoczętej sesji','text-button') : ''}</div>` : ''}<h2>Dotknij i zacznij</h2><div class="mode-grid">${(Object.keys(labels) as Mode[]).filter(m=>m!=='lesson').map(m => `<button data-action="mode" data-mode="${m}" aria-label="${labels[m]}" aria-describedby="mode-description-${m}" class="mode-card"><span class="stat-icon ${isFlashcardMode(m) ? 'peach' : m === 'grammar' ? 'lavender' : 'mint'}">${icon(isFlashcardMode(m) ? 'cards' : m === 'review' ? 'repeat' : m === 'grammar' ? 'book' : 'spark')}</span><strong>${labels[m]} →</strong><span id="mode-description-${m}">${descriptions[m]}</span></button>`).join('')}</div><details class="session-settings"><summary>Zakres sesji i materiały</summary><label class="checkbox"><input id="previous" type="checkbox" ${previous ? 'checked' : ''}> Dołącz powtórkę wcześniejszych modułów</label><p>Do 10 pytań w sesji. Trudniejsze zadania wrócą jeszcze raz.${!modules.some(m => m.order < selected.order) ? ' Nie dodano jeszcze wcześniejszych modułów.' : ''}</p><p>${e(selected.source)}</p></details></section><section class="panel grammar-guide"><h2>Przypomnij sobie zasady</h2><p>Krótka ściąga z tego modułu. Rozwiń temat, który chcesz powtórzyć.</p>${selected.grammar.map(rule => `<details><summary>${e(rule.title)}</summary><p>${e(rule.explanation)}</p><ul>${rule.examples.map(example=>`<li>${e(example)}</li>`).join('')}</ul><p class="source-reference">${e(rule.source)}</p></details>`).join('')}</section>`;
}
function illustrationView(picture: Illustration | undefined, showCaption: boolean) {
  if (!picture) return '';
  return `<figure class="answer-illustration ${picture.scene ? 'context-illustration' : ''} ${showCaption ? '' : 'question-illustration'}" ${showCaption ? '' : 'aria-hidden="true"'}>${picture.src ? `<img src="${e(new URL(picture.src,document.baseURI).href)}" alt="${showCaption ? e(picture.caption) : ''}" width="200" height="140">` : `<span role="img" aria-label="${showCaption ? e(picture.caption) : ''}">${e(picture.symbol)}</span>`}${showCaption ? `<figcaption>${e(picture.caption)}</figcaption>` : ''}</figure>`;
}
function answerComparison(q: Exercise, session: Session) {
  const attempt=session.attempts.find(a=>a.key===session.items[session.index].key);
  const answer=attempt?.lastAnswer ?? (attempt?.corrections===0 ? attempt.answer : undefined);
  const comparison=closestAnswer(answer ?? '',q.answers,q.caseSensitive);
  const parts=(values: AnswerPart[])=>values.map(part=>part.different?`<mark>${e(part.text)}</mark>`:e(part.text)).join('');
  return `<div class="answer-comparison"><div class="given-answer"><span>Twoja odpowiedź</span><p>${answer===undefined ? 'Ostatnia odpowiedź nie jest dostępna w tym starszym zapisie.' : parts(comparison.given)}</p></div><div class="expected-answer"><span>Poprawna odpowiedź</span><p>${parts(comparison.expected)}</p></div><small>Wyróżnione fragmenty pokazują różnice.</small></div>`;
}
function catView(reaction:CatReaction,large=false){
  if(!catCatalog)return '';
  const {cat,frame,mood}=reaction,sheet=catCatalog.sheets[frame.sheet];
  const labels={teacher:'cierpliwy nauczyciel',happy:'zadowolony kotek',celebrating:'świętujący kotek',funny:'zabawna scenka'};
  const clipId=`cat-clip-${cat.id}-${mood}`;
  return `<figure class="cat-mascot ${large?'cat-mascot-large':''}" data-cat="${cat.id}" data-mood="${mood}"><svg class="cat-artwork" viewBox="${frame.x} ${frame.y} ${frame.width} ${frame.height}" role="img" aria-label="${e(cat.name)} — ${labels[mood]}" preserveAspectRatio="xMidYMid meet"><defs><clipPath id="${clipId}">${frame.clip?`<polygon points="${frame.clip.map(p=>p.join(',')).join(' ')}"/>`:`<rect x="${frame.x}" y="${frame.y}" width="${frame.width}" height="${frame.height}"/>`}</clipPath></defs><image href="${e(new URL(sheet.src,document.baseURI).href)}" width="${sheet.width}" height="${sheet.height}" clip-path="url(#${clipId})"/></svg>${large?`<figcaption>${e(cat.name)}</figcaption>`:''}</figure>`;
}
function study() {
  const s = progress.active;
  if (!s) return `<h1>Sesja zakończona</h1>${button('home','Wróć do modułów')}`;
  if (!sessionCompatible(modules,s)) return `<h1>Potrzebny jest moduł</h1><p>Ta sesja pochodzi z innej wersji materiału lub brakującego modułu. Jej zapis i Twoja historia są bezpieczne. Możesz zapisać kopię albo rozpocząć nową sesję z dostępnego modułu.</p>${button('backup','Kopia postępów')}${button('home','Moja nauka','secondary')}`;
  const item = s.items[s.index];
  const q = questionFor(modules,item);
  const percent = Math.round(s.index / s.items.length * 100);
  let card = '';
  card = `<div class="exercise-label">${icon(item.type === 'word' ? 'cards' : q.kind === 'grammar' ? 'book' : 'spark')} ${item.type === 'word' ? 'FISZKA · PODAJ PO ANGIELSKU' : q.kind === 'dialogue' ? 'POROZMAWIAJMY' : q.kind === 'grammar' ? 'MAŁY KROK W GRAMATYCE' : 'SŁÓWKO PO SŁÓWKU'}</div><h2 class="question">${e(q.prompt)}</h2>`;
  if(q.dialogue)card += `<div class="dialogue" aria-label="Dialog do uzupełnienia">${q.dialogue.map((line,i)=>`<div class="dialogue-line ${i%2?'dialogue-reply':''}"><span class="dialogue-speaker">${e(line.speaker)}</span><p>${line.text.split('___').map(e).join('<span class="dialogue-gap" aria-label="luka">…</span>')}</p></div>`).join('')}</div>`;
  if(s.stageReview){const entry=reviewState(progress,s.stageReview.id)?.items[item.key];card+=`<p class="review-meter">Utrwalenie: <strong>${entry?.correct??0}/3</strong><span>Wynik tej próby zapiszemy po ukończeniu tury.</span></p>`;}
  if (s.phase === 'feedback') {
    const ok = s.lastCorrect;
    card += `<div class="feedback ${ok ? 'correct' : 'incorrect'}" role="status"><div class="feedback-lead"><strong>${ok ? 'Tak jest! Dobra robota ✦' : 'Spokojnie, tak właśnie się uczymy.'}</strong>${catCatalog?catView(responseCat(catCatalog,s)):''}</div>${!ok ? answerComparison(q,s) : ''}<p>${e(q.explanation)}</p>${q.source ? `<p class="source-reference">Źródło: ${e(q.source)}</p>` : ''}${illustrationView(q.illustration,true)}</div><div class="actions">${!ok ? button('retry','Spróbuję jeszcze raz','secondary') : ''}${button('next',`Dalej ${icon('arrow')}`)}</div>`;
  } else {
    card += illustrationView(q.illustration,false);
    card += s.phase === 'retry' ? '<p class="retry-note">Teraz spróbuj ponownie. Pierwszy wynik pozostanie zapisany osobno.</p>' : '<p>Nie musisz wiedzieć wszystkiego. Po prostu spróbuj.</p>';
    card += inputFor(q,item.input,s.mode) === 'choice' ? `<div class="answer-options">${optionsFor(q,s).map((o,i) => `<button class="option" data-action="answer" data-answer="${e(o)}"><span aria-hidden="true">${String.fromCharCode(65+i)}</span>${e(o)}</button>`).join('')}</div>` : `<form id="answer-form"><label for="answer" class="sr-only">Twoja odpowiedź</label><input id="answer" name="answer" class="answer-input" placeholder="Wpisz odpowiedź…" autocomplete="off" autocorrect="off" enterkeyhint="done" autocapitalize="off" spellcheck="false" maxlength="500" required><button class="primary" type="submit">Sprawdź ${icon('check')}</button></form>`;
  }
  return `<button class="back" data-action="home">← Wróć do modułów · sesja zostaje zapisana</button><div class="study-heading"><div><div class="eyebrow">TWÓJ MAŁY KROK</div><h1>${e(s.stageReview?.title??s.lesson?.title??labels[s.mode])}</h1></div><span class="tag">${s.index + 1} / ${s.items.length}</span></div><div class="progress-track" role="progressbar" aria-label="Pytanie ${s.index + 1} z ${s.items.length}" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><span style="width:${percent}%"></span></div><section class="study-card">${card}</section><p class="under-card">${icon('check')} ${storageError ? 'Zapis niedostępny — zapisz kopię przed zamknięciem.' : 'Każdy krok zapisuje się na tym urządzeniu.'}</p>`;
}
function stageReviewSummary(s:Session){
  const context=stageForSession(journeys,s);if(!context)return '';
  const stats=reviewStats(progress,context.journey,context.stage);
  return `<div class="review-result"><strong>${stats.percent}% utrwalenia</strong><p>${stats.pending?`Do kolejnych tur: ${e(pendingLabel(stats))}.`:'Wszystkie zebrane pozycje osiągnęły 3/3 ✓'}</p>${!stats.pending&&!reviewState(progress,context.key)?.rewardedAt?'<p>Do nagrody 3 ★ pozostało ukończyć lekcje tego etapu.</p>':''}</div>`;
}
function summary() {
  const s = lastSession ?? progress.sessions.at(-1);
  if (!s) return home();
  const result = score(s);
  return `<section class="summary panel"><div class="celebration">${catCatalog?catView(endingCat(catCatalog,s),true):icon('cat')}</div><div class="eyebrow">KOLEJNY MAŁY KROK ZA TOBĄ</div><h1>${user ? user.displayName ? `Dobra robota, ${e(user.displayName)}!` : 'Dobra robota!' : 'Dobra robota, Haniu!'}</h1><p>Każda próba pomaga. Dziś wiesz już trochę więcej.</p>${s.lesson||s.stageReview?`<div class="lesson-reward">${lastReward?`+${lastReward} ★`:s.stageReview?'Tura zapisana ✓':'Lekcja utrwalona ✓'}<small>${lastReward?`Gwiazdki są już w Twoim portfelu.${lastStageReward?` W tym ${lastStageReward} ★ za ukończony etap i 100% w powtórce.`:''}`:s.stageReview?'Każda samodzielna poprawna odpowiedź przybliża utrwalenie.':'Nagroda za pierwsze ukończenie tej lekcji jest już przyznana.'}</small></div>`:''}${s.stageReview?stageReviewSummary(s):!s.attempts.length ? `<div class="summary-score">${new Set(s.items.map(i => i.key)).size}<span>przećwiczonych fiszek</span></div>` : `<div class="summary-score">${result.correct}<small> / ${result.total}</small><span>poprawnie za pierwszym razem</span></div><p>Poprawione za drugim razem: <b>${result.corrections}</b>. Ten wynik liczymy osobno.</p>`}<div class="actions journey-summary-actions">${s.lesson||s.stageReview?`${button('map','Wróć na mapę')}${button('house','Urządź domek','secondary')}`:`${button('home','Wróć do modułów')}${button('progress','Zobacz postępy','secondary')}`}</div></section>`;
}
function historyRow(session:Session){
  const result=score(session),m=modules.find(m=>m.id===session.moduleId);
  return `<div class="history-row"><div><strong>${e(session.stageReview?.title??session.lesson?.title??labels[session.mode])} · ${e(m?.name??'Moduł spoza biblioteczki')}</strong><span>${date(session.completedAt!)}${!m||!sessionCompatible(modules,session)?' · archiwalny materiał':''}</span></div><div class="history-score">${!session.attempts.length?`${new Set(session.items.map(i=>i.key)).size} fiszek`:`${result.correct}/${result.total}`}<small>${!session.attempts.length?'przećwiczonych':`pierwsze próby · ${result.corrections} poprawionych`}</small></div></div>`;
}
function progressView() {
  const s=stats();
  return `<div class="eyebrow">WSZYSTKIE MAŁE KROKI SIĘ LICZĄ</div><h1>Twoje postępy</h1><p class="lead">Tu zobaczysz, co już potrafisz i do czego warto wrócić.</p><section class="stats-grid"><article><span class="stat-icon peach">${icon('cards')}</span><div><strong>${s.known}</strong><span>Znane fiszki</span></div></article><article><span class="stat-icon lavender">${icon('repeat')}</span><div><strong>${s.review}</strong><span>Rzeczy do powtórki</span></div></article><article><span class="stat-icon mint">${icon('chart')}</span><div><strong>${s.accuracy===null?'—':`${s.accuracy}%`}</strong><span>Pierwsze odpowiedzi</span></div></article></section><section class="panel"><h2>Moduł po module</h2>${modules.map(m=>{
    const sessions=progress.sessions.filter(s=>s.moduleId===m.id),all=sessions.flatMap(s=>s.attempts),archived=progress.history?.modules[m.id];
    const total=all.length+(archived?.total??0),correct=all.filter(a=>a.first).length+(archived?.correct??0);
    return `<div class="history-row"><div><strong>${e(m.name)}</strong><span>${sessions.length+(archived?.sessions??0)} ukończonych sesji · ${total?`${Math.round(correct/total*100)}% pierwszych odpowiedzi`:'Jeszcze bez ocenionych odpowiedzi'}</span></div><button class="secondary" data-action="module" data-id="${e(m.id)}">Poćwicz</button></div>`;
  }).join('')}</section><section class="panel"><h2>Historia nauki</h2>${!sessionCount(progress)?`<div class="empty">${icon('leaf')}<h3>Tu wyrosną Twoje postępy</h3><p>Zacznij pierwszą sesję. Nie trzeba od razu umieć wszystkiego.</p>${button('home','Wybierz moduł')}</div>`:[...progress.sessions].reverse().concat(olderSessions).map(historyRow).join('')}${progress.history?.sessions?`<p class="archive-note">Starsze sesje są zachowane w osobnych częściach. Wszystkie wyniki są uwzględnione w statystykach. Na tym urządzeniu nowsze części są dostępne offline; pobranie brakującej starszej części wymaga internetu.</p>${olderHead?button('older-history','Pokaż starsze sesje','secondary'):''}`:''}</section>`;
}
function backupView() {
  return `<div class="eyebrow">TWOJA NAUKA, BEZPIECZNIE</div><h1>Kopia postępów</h1><p class="lead">Zachowaj swoje małe kroki albo zabierz je na inne urządzenie.</p><section class="panel account-invite"><h2>Konto i synchronizacja</h2><p>${user ? `Konto: ${e(user.email ?? 'zapisane na urządzeniu')}. Wyniki możesz przenosić automatycznie między urządzeniami.` : 'Zaloguj się, aby zapisywać wyniki na koncie i kontynuować naukę na drugim urządzeniu.'}</p>${button('account',user ? 'Otwórz konto' : 'Zaloguj się lub utwórz konto')}</section><div class="backup-grid"><section class="panel"><span class="stat-icon mint">${icon('cloud')}</span><h2>Zapisz kopię</h2><p>Pobierz plik z wynikami, historią, fiszkami i rozpoczętą sesją. Schowaj go w bezpiecznym miejscu.</p>${button('export','Zapisz kopię postępów')}</section><section class="panel"><span class="stat-icon lavender">${icon('repeat')}</span><h2>Wczytaj kopię</h2><p>Wybierz wcześniej zapisany plik. Najpierw go sprawdzimy, a potem poprosimy o potwierdzenie.</p><label class="secondary file-label">Wybierz plik kopii<input type="file" id="import-file" accept=".json,application/json"></label></section></div><section class="panel note-panel"><h2>Warto wiedzieć</h2><p>Bez logowania postępy są zapisane tylko w tej przeglądarce. Po zalogowaniu aplikacja synchronizuje je z kontem, gdy ma połączenie z internetem. Plik kopii pozwala dodatkowo zachować wyniki lub przenieść je ręcznie.</p><p>Kopia nie zawiera modułów ani zdjęć książki. Brakujący moduł nie usuwa wyników, ale do dalszej nauki potrzebne są jego materiały.</p></section>${pending ? `<section class="panel import-confirm" role="region" aria-label="Potwierdzenie importu"><h2>Wczytać tę kopię?</h2><p>Kopia z <strong>${date(pending.exportedAt)}</strong>, ukończone sesje: <strong>${sessionCount(pending.progress)}</strong>.</p><p>Wczytanie <strong>zastąpi wszystkie obecne postępy</strong>. Pliki nie zostaną połączone.</p>${pending.progress.active && !sessionCompatible(modules,pending.progress.active) ? '<p>Zapisana sesja wymaga brakującego lub zmienionego modułu. Zachowamy ją, ale na razie nie będzie można jej wznowić.</p>' : ''}<div class="actions">${button('export','Najpierw zapisz obecne','secondary')}${button('confirm-import','Zastąp postępy')}${button('cancel-import','Anuluj','text-button')}</div></section>` : ''}`;
}
function accountView() {
  const heading='<div class="eyebrow">TWOJE MAŁE KROKI, NA RÓŻNYCH URZĄDZENIACH</div><h1>Konto i synchronizacja</h1>';
  if(!user || reauthNeeded)return `${heading}<p class="lead">${reauthNeeded?'Zapis konta jest zachowany na urządzeniu. Zaloguj się ponownie, aby połączyć go z chmurą.':'Każde konto ma własne imię i postępy. Możesz utworzyć osobne konto do testów i kontynuować naukę na drugim urządzeniu. Bez logowania nadal działa osobny zapis lokalny.'}</p><section class="panel account-panel"><h2>${registerAccount?'Utwórz konto':'Zaloguj się'}</h2>${accountError?`<p class="account-error" role="alert">${e(accountError)}</p>`:''}${accountNotice?`<p role="status">${e(accountNotice)}</p>`:''}<form id="account-form" class="account-form">${registerAccount?'<label for="register-name">Imię</label><input id="register-name" name="displayName" autocomplete="given-name" required maxlength="50">':''}<label for="account-email">E-mail</label><input id="account-email" name="email" type="email" autocomplete="username" required maxlength="254"><label for="account-password">Hasło${registerAccount?' — co najmniej 8 znaków':''}</label><input id="account-password" name="password" type="password" autocomplete="${registerAccount?'new-password':'current-password'}" minlength="${registerAccount?8:1}" required maxlength="128"><button class="primary" type="submit">${registerAccount?'Utwórz konto':'Zaloguj się'}</button>${!registerAccount?'<button class="text-button" type="submit" value="reset" formnovalidate>Nie pamiętam hasła</button>':''}</form>${button('auth-toggle',registerAccount?'Mam już konto — zaloguj się':'Nie mam konta — utwórz konto','text-button')}</section>`;
  const statuses={local:'Wyniki są na tym urządzeniu.',checking:'Sprawdzamy zapis na koncie…',saved:'Wyniki zapisane na koncie.',pending:'Wyniki zapisane na urządzeniu. Czekają na wysłanie.',conflict:'Na koncie i urządzeniu są różne wersje wyników.',error:'Nie udało się zsynchronizować. Wyniki są zachowane na urządzeniu.'};
  const error=accountError || (sync.error?cloudError(sync.error):'');
  const description=(p:Progress)=>`${sessionCount(p)} ukończonych sesji${p.active?' i rozpoczęta sesja':''}, ${Object.values(p.words).filter(v=>v==='known').length} znanych fiszek`;
  return `${heading}<section class="panel account-panel"><h2>Twoje konto</h2><p class="account-email">${e(user.email??'Konto zapisane na urządzeniu')}</p><p role="status">${statuses[sync.status]}${sync.cache?.lastSync?`<br>Ostatnie połączenie: ${date(sync.cache.lastSync)}.`:''}</p>${error?`<p class="account-error" role="alert">${e(error)}</p>`:''}${accountNotice?`<p>${e(accountNotice)}</p>`:''}<div class="actions">${button('sync-now','Synchronizuj teraz')}${button('logout','Wyloguj się','secondary')}${button('switch-account','Zmień konto','text-button')}</div><p>Po wylogowaniu wrócisz do osobnego zapisu bez konta. Wyniki konta pozostają na nim oraz w lokalnej kopii tego konta.</p></section>${accountSettings()}${sync.offerGuest?`<section class="panel"><h2>Masz wcześniejsze postępy na tym urządzeniu</h2><p>${description(guestProgress)}. Są bezpieczne w zapisie bez konta. Możesz przenieść je na konto lub zachować oddzielnie.</p>${hasProgress(progress)?'<p>Na koncie też są wyniki. Przeniesienie zastąpi bieżący zapis konta; zachowamy jego kopię.</p>':''}<div class="actions">${button('guest-copy','Przenieś postępy na konto')}${button('guest-skip','Zachowaj oddzielnie','secondary')}</div></section>`:''}${sync.conflict?`<section class="panel sync-conflict" aria-label="Różne wersje wyników"><h2>Wybierz zapis, z którym chcesz kontynuować</h2><p>Drugie urządzenie zmieniło wyniki. Nie nadpisujemy ich automatycznie. Wybrana wersja będzie bieżąca; druga pozostanie do pobrania jako kopia sprzed zmiany.</p><div class="sync-versions"><div><h3>Na tym urządzeniu</h3><p>${description(progress)}</p>${button('export','Zapisz kopię z urządzenia','secondary')}${button('resolve-local','Użyj wyników z urządzenia')}</div><div><h3>Na koncie</h3><p>${description(sync.conflict.remote?.progress??emptyProgress())}</p>${button('export-cloud','Zapisz kopię z konta','secondary')}${button('resolve-cloud','Użyj wyników z konta')}</div></div></section>`:''}<section class="panel"><h2>Kopie i zapis lokalny</h2><p>Warto zachować także plik kopii. Nie zawiera hasła ani danych logowania.</p><div class="actions">${button('export','Zapisz kopię postępów','secondary')}${sync.cache?.recovery?button('export-recovery','Zapisz kopię sprzed zmiany','secondary'):''}${button('backup','Kopia postępów','text-button')}</div>${hasProgress(guestProgress)&&!sync.offerGuest?`<details><summary>Wcześniejsze postępy bez konta</summary><p>${description(guestProgress)}. Przeniesienie zastąpi bieżący zapis konta i zachowa jego poprzednią kopię.</p>${button('guest-copy','Przenieś postępy na konto','secondary')}</details>`:''}</section>`;
}
function accountSettings(){
  return `<section class="panel account-settings"><h2>Ustawienia konta</h2><p>Imię, e-mail i hasło dotyczą tylko zalogowanego konta. Zmiana e-maila nie usuwa postępów.</p><details ${accountSection==='name'?'open':''}><summary>Imię</summary><form id="profile-form" class="account-form"><label for="profile-name">Twoje imię</label><input id="profile-name" name="displayName" autocomplete="given-name" value="${e(user?.displayName??'')}" required maxlength="50"><button class="primary" type="submit">Zapisz imię</button></form></details><details ${accountSection==='email'?'open':''}><summary>Zmień e-mail</summary><p>Wyślemy link na nowy adres. Adres zmieni się dopiero po jego potwierdzeniu. Potem kliknij „Odśwież dane konta” lub zaloguj się nowym adresem.</p><form id="email-form" class="account-form"><label for="new-email">Nowy e-mail</label><input id="new-email" name="email" type="email" autocomplete="email" required maxlength="254"><label for="email-current-password">Obecne hasło — potwierdzenie zmiany e-maila</label><input id="email-current-password" name="currentPassword" type="password" autocomplete="current-password" required maxlength="128"><button class="primary" type="submit">Wyślij potwierdzenie zmiany e-maila</button></form>${button('refresh-account','Odśwież dane konta','secondary')}</details><details ${accountSection==='password'?'open':''}><summary>Zmień hasło</summary><form id="password-form" class="account-form"><label for="current-password">Obecne hasło</label><input id="current-password" name="currentPassword" type="password" autocomplete="current-password" required maxlength="128"><label for="new-password">Nowe hasło — co najmniej 8 znaków</label><input id="new-password" name="newPassword" type="password" autocomplete="new-password" required minlength="8" maxlength="128"><label for="confirm-password">Powtórz nowe hasło</label><input id="confirm-password" name="confirmPassword" type="password" autocomplete="new-password" required minlength="8" maxlength="128"><button class="primary" type="submit">Zmień hasło</button></form></details></section>`;
}
async function rememberAccount(account:AccountUser){
  if(!user || account.uid!==user.uid)throw new Error('Konto się zmieniło. Zaloguj się ponownie.');
  user={uid:account.uid,email:account.email,displayName:account.displayName??null};await writeStored('firebase-user',user);
}
function cloudError(error:unknown) {
  const code=(error as {code?:string})?.code;
  if(code==='permission-denied')return 'Brak dostępu do zapisu w chmurze. Sprawdź reguły Firestore lub zaloguj się ponownie. Lokalna kopia jest zachowana.';
  return error instanceof Error && !code?error.message:'Połączenie z kontem jest niedostępne. Spróbuj ponownie później; możesz kontynuować naukę z lokalnym zapisem.';
}
function render() {
  const historyContext=`${user?.uid??'guest'}:${progress.history?.head??'none'}`;
  if(viewedHistory!==historyContext){viewedHistory=historyContext;olderSessions=[];olderHead=progress.history?.head;}
  document.body.classList.toggle('studying',screen==='study');
  document.body.classList.toggle('home-screen',screen==='home');
  const summarySession=lastSession??progress.sessions.at(-1);
  document.body.classList.toggle('journey-summary',screen==='summary'&&!!(summarySession?.lesson||summarySession?.stageReview));
  const focused = document.activeElement as HTMLElement | null;
  const focusAction = focused?.dataset.action;
  const focusId = focused?.id;
  const changedScreen = renderedScreen !== screen;
  const helpOpen=!changedScreen && !!root.querySelector<HTMLDetailsElement>('.home-help')?.open;
  root.innerHTML = shell(({ home, journeys:journeyList, 'module-list':moduleList, setup, study, progress: progressView, backup: backupView, account: accountView, summary, map:mapView, 'lesson-intro':introView, house:homeForCats }[screen])());
  const help=root.querySelector<HTMLDetailsElement>('.home-help');if(help)help.open=helpOpen;
  root.setAttribute('aria-busy', String(busy));
  if (!ready || busy) root.querySelectorAll<HTMLButtonElement | HTMLInputElement>('button,input').forEach(el => el.disabled = true);
  if (changedScreen) {
    window.scrollTo(0, 0);
    const heading = root.querySelector<HTMLElement>('h1');
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  } else if (screen==='study' && progress.active?.phase==='retry') {
    root.querySelector<HTMLInputElement>('#answer')?.focus();
  } else if (screen === 'study' && progress.active?.phase === 'feedback') {
    const feedback = root.querySelector<HTMLElement>('.feedback');
    if (feedback) { feedback.tabIndex = -1; feedback.focus({ preventScroll: true }); }
  } else {
    const target = focusId ? document.getElementById(focusId) : Array.from(root.querySelectorAll<HTMLElement>('[data-action]')).find(el => el.dataset.action === focusAction);
    target?.focus({ preventScroll: true });
  }
  renderedScreen = screen;
}
async function mutate(change: (p: Progress) => void) {
  const expectedVersion=sync.cache?.localVersion;
  let draft = structuredClone(progress);
  change(draft);
  if(user){await sync.save(draft,expectedVersion);draft=structuredClone(sync.cache!.progress);}
  else {draft=await prepareProgress(draft);await save(draft);guestProgress=structuredClone(draft);}
  progress = draft; storageError = '';scheduleSync();
}
async function downloadProgress(value: Progress,suffix='') {
  let complete:Backup;
  try{complete=await fullBackup(value,getHistoryPage);}catch(error){notice=(error as Error).message;return;}
  const url = URL.createObjectURL(new Blob([JSON.stringify(complete, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = `hania-postepy-${new Date().toISOString().slice(0,10)}${suffix?'-'+suffix:''}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  notice = 'Plik kopii został przygotowany do pobrania. Zachowaj go, aby móc odtworzyć postępy.';
}
async function exportProgress(){await downloadProgress(progress);}
async function startStageReview(j:Journey,stage:Journey['stages'][number]){
  if(progress.active?.stageReview?.id===`${j.moduleId}/${stage.id}`){screen='study';return;}
  const session=makeStageReviewSession(modules,j,stage,answerMode,progress);
  if(!session){notice='Brak zaległych powtórek w tym etapie.';return;}
  if(progress.active&&!window.confirm('Rozpocząć powtórkę zamiast niedokończonej sesji? Ukończone wyniki pozostaną zachowane.'))return;
  await mutate(p=>{p.active=session;});lastReward=0;lastStageReward=0;screen='study';
}
async function action(action: string, el: HTMLElement) {
  notice = '';
  if(action==='next-step'){
    const step=getNextStep(modules,journeys,progress);
    selected=modules.find(m=>m.id===step.moduleId)??selected??modules[0];
    switch(step.kind){
      case 'resume':screen='study';break;
      case 'lesson':introLessonId=step.lessonId;answerMode='mixed';screen='lesson-intro';break;
      case 'stage-review':{
        const j=currentJourney(),stage=j?.stages.find(s=>s.id===step.stageId);
        if(j&&stage)await startStageReview(j,stage);break;
      }
      case 'review':{
        const session=makeSession(modules,selected,'review','text',false,progress);
        if(session.items.length){await mutate(p=>{p.active=session;});lastReward=0;lastStageReward=0;screen='study';}break;
      }
      case 'practice':screen=step.moduleId?'setup':'module-list';break;
      case 'unavailable':screen='module-list';break;
    }
    return;
  }
  if(action==='journeys'){screen='journeys';scheduleReviewMigration();return;}
  if(action==='module-list'){screen='module-list';return;}
  if(action==='map'){selected=modules.find(m=>m.id===el.dataset.id)??selected??modules[0];screen='map';scheduleReviewMigration();return;}
  if(action==='stage-review'){
    const j=currentJourney(),stage=j?.stages.find(s=>s.id===el.dataset.id);if(!j||!stage)return;
    await startStageReview(j,stage);return;
  }
  if(action==='house'){screen='house';return;}
  if(action==='open-lesson'||action==='begin-lesson'){
    const j=currentJourney(),l=j&&lessons(j).find(l=>l.lesson.id===el.dataset.id)?.lesson;
    if(!j||!l||!unlocked(j,l,progress)){notice='Najpierw ukończ wcześniejszą lekcję.';return;}
    if(action==='open-lesson'){introLessonId=l.id;answerMode='mixed';screen='lesson-intro';return;}
    if(progress.active&&!window.confirm('Rozpocząć lekcję zamiast niedokończonej sesji? Ukończone wyniki pozostaną zachowane.'))return;
    await mutate(p=>{p.active=makeLessonSession(modules,j,l,answerMode,p);});lastReward=0;lastStageReward=0;screen='study';return;
  }
  if(action==='select-decoration'){chosenDecoration=el.dataset.id??'pillow';return;}
  if(action==='buy-decoration'){
    let bought=false;await mutate(p=>{bought=purchase(p,el.dataset.id??'');});
    notice=bought?'Nowa dekoracja jest Twoja! Możesz wybrać dla niej miejsce.':'Przedmiot jest już Twój albo potrzeba jeszcze kilku gwiazdek.';return;
  }
  if(action==='place-decoration'){await mutate(p=>{place(p,el.dataset.id??'',el.dataset.slot||null);});notice='Ustawienie domku zapisane.';return;}
  if(action==='older-history'){
    if(!olderHead)return;
    try{const page=await getHistoryPage(olderHead);olderSessions.push(...[...page.sessions].reverse());olderHead=page.previous;}catch(error){notice=(error as Error).message;}
    return;
  }
  if(action==='pwa-install'){await installPwa();return;}
  if(action==='pwa-prepare'){await prepareOffline();return;}
  if(action==='pwa-update'){
    if(progress.active && !window.confirm('Wczytać nową wersję? Strona zostanie odświeżona, a zapisana sesja pozostanie zachowana.'))return;
    applyUpdate();return;
  }
  if(action==='account'){screen='account';accountError='';return;}
  if(action==='auth-toggle'){registerAccount=!registerAccount;accountError='';return;}
  if(action==='refresh-account'){
    accountError='';accountNotice='';
    try{if(!navigator.onLine)throw new Error('Odświeżenie danych konta wymaga internetu.');const account=await deadline((await sdk()).restoreUser());if(!account)throw new Error('Zaloguj się ponownie.');await rememberAccount(account);accountNotice='Dane konta zostały odświeżone.';}catch(error){accountError=firebaseMessage(error);}return;
  }
  if(action==='logout'||action==='switch-account'){
    authWorking=true;
    try{await (await sdk()).logout();await sync.disconnect();await writeStored('firebase-user',null);user=null;reauthNeeded=false;progress=await load();guestProgress=structuredClone(progress);pending=null;lastSession=null;accountNotice='Wylogowano. Widoczny jest osobny zapis bez konta; wyniki konta pozostały zachowane.';}catch(error){accountError=firebaseMessage(error);}finally{authWorking=false;}return;
  }
  if(action==='sync-now'){await sync.sync();return;}
  if(action==='guest-copy'){
    if(hasProgress(progress) && !window.confirm('Postępy z tego urządzenia zastąpią bieżące postępy konta. Zachowamy kopię dotychczasowego zapisu. Kontynuować?'))return;
    await sync.useGuest(guestProgress);scheduleSync(0);return;
  }
  if(action==='guest-skip'){sync.dismissGuest();return;}
  if(action==='resolve-local' || action==='resolve-cloud'){
    if(!window.confirm('Wybrany zapis stanie się bieżącym. Druga wersja pozostanie do pobrania jako kopia sprzed zmiany. Kontynuować?'))return;
    await sync.resolve(action==='resolve-local'?'local':'cloud');return;
  }
  if(action==='export-cloud'){await downloadProgress(sync.conflict?.remote?.progress??emptyProgress(),'konto');return;}
  if(action==='export-recovery' && sync.cache?.recovery){await downloadProgress(sync.cache.recovery,'sprzed-zmiany');return;}
  if (['home','progress','backup'].includes(action)) { screen = action as 'home'|'progress'|'backup'; pending = null; }
  else if (action === 'module' || action === 'quick-start') { selected = modules.find(m => m.id === el.dataset.id) ?? modules[0]; screen = 'setup'; }
  else if (action === 'resume') screen = 'study';
  else if (action === 'mode') {
    mode = el.dataset.mode as Mode;
    const session = makeSession(modules, selected, mode, answerMode, previous, progress);
    if (!session.items.length) { notice = 'Nie ma zadań do tej sesji. Znane fiszki pomijamy. Możesz wybrać quiz lub gramatykę.'; return; }
    if (progress.active && !window.confirm('Rozpoczęcie nowej sesji zastąpi niedokończoną sesję. Zakończona historia i zapisane trudności pozostaną. Kontynuować?')) return;
    await mutate(p => { p.active = session; }); screen = 'study';
  } else if (action === 'answer') {
    const s = progress.active;
    if (!s) return;
    const q = questionFor(modules,s.items[s.index]);
    await mutate(p => { const session=p.active!;if(recordAnswer(p,q,el.dataset.answer??'')===false)recordStageError(p,session,session.items[session.index],journeys); });
  } else if (action === 'retry') await mutate(p => { if (p.active?.phase === 'feedback' && p.active.lastCorrect === false) { p.active.phase = 'retry'; p.active.lastCorrect = null; } });
  else if (action === 'next') {
    const earned=progress.adventure?.earned??0,bonuses=Object.values(progress.adventure?.stageReviews??{}).filter(r=>r.rewardedAt).length;
    lastReward=0;lastStageReward=0;
    await mutate(p=>{if(p.active?.phase==='feedback'){const finished=p.active;next(p);if(!p.active){finishStageReview(p,finished);rewardCompletion(p,finished);}}});
    if(!progress.active){lastReward=(progress.adventure?.earned??0)-earned;lastStageReward=(Object.values(progress.adventure?.stageReviews??{}).filter(r=>r.rewardedAt).length-bonuses)*3;lastSession=progress.sessions.at(-1)!;screen='summary';}
  }
  else if (action === 'export') await exportProgress();
  else if (action === 'cancel-import') pending = null;
  else if (action === 'confirm-import' && pending) { const complete=await validateFullBackup(pending);for(const page of complete.archives??[])await putHistoryPage(page);const imported=complete.progress; await mutate(p=>{delete p.history;delete p.adventure;Object.assign(p,imported);}); pending = null; storageError = ''; notice = 'Kopia została wczytana. Twoje postępy są już na tym urządzeniu.'; }
}
async function run(task: () => Promise<void>) {
  if (busy || !ready) return;
  busy = true;
  root.setAttribute('aria-busy', 'true');
  root.querySelectorAll<HTMLButtonElement>('button').forEach(b => b.disabled = true);
  try { await task(); }
  catch (err) { storageError = 'Nie udało się zapisać zmiany. Poprzednie dane są zachowane. Spróbuj ponownie lub zapisz kopię postępów.'; console.error(err); }
  finally { busy = false; render(); }
}
root.addEventListener('click', ev => {
  const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!el) return;
  ev.preventDefault(); void run(() => action(el.dataset.action!,el));
});
root.addEventListener('submit', ev => {
  if(['profile-form','email-form','password-form'].includes((ev.target as HTMLElement).id)){
    ev.preventDefault();
    const form=ev.target as HTMLFormElement,kind=form.id;accountSection=kind==='profile-form'?'name':kind==='email-form'?'email':'password';
    const value=(name:string)=>(form.elements.namedItem(name) as HTMLInputElement).value;
    const data=kind==='profile-form'?{name:value('displayName')}:kind==='email-form'?{email:value('email'),password:value('currentPassword')}:{password:value('currentPassword'),next:value('newPassword'),confirm:value('confirmPassword')};
    void run(async()=>{
      accountError='';accountNotice='';authWorking=true;
      try{
        if(!navigator.onLine)throw new Error('Zmiana ustawień konta wymaga internetu. Postępy pozostają zapisane.');
        if(kind==='password-form' && data.next!==data.confirm)throw new Error('Nowe hasła nie są takie same. Wpisz je ponownie.');
        const firebase=await sdk();
        if(kind==='profile-form'){await rememberAccount(await deadline(firebase.changeName(data.name!,user!.uid)));accountNotice='Imię zostało zapisane.';}
        else if(kind==='email-form'){await deadline(firebase.changeEmail(data.email!,data.password!,user!.uid));accountNotice='Wysłaliśmy link na nowy adres. Otwórz go, aby potwierdzić zmianę e-maila. Do tego czasu działa dotychczasowy adres.';}
        else {await deadline(firebase.changePassword(data.password!,data.next!,user!.uid));accountNotice='Hasło zostało zmienione. Przy kolejnym logowaniu użyj nowego hasła.';}
      }catch(error){accountError=firebaseMessage(error);}
      finally{authWorking=false;}
    });return;
  }
  if((ev.target as HTMLElement).id==='account-form'){

    ev.preventDefault();
    const form=ev.target as HTMLFormElement,email=(form.elements.namedItem('email') as HTMLInputElement).value.trim(),password=(form.elements.namedItem('password') as HTMLInputElement).value;
    const name=(form.elements.namedItem('displayName') as HTMLInputElement|null)?.value??'';
    const reset=(ev as SubmitEvent).submitter?.getAttribute('value')==='reset';
    void run(async()=>{
      authWorking=true;accountError='';accountNotice='';
      try{
        if(!navigator.onLine)throw new Error('Logowanie i odzyskanie hasła wymagają internetu. Możesz wrócić do nauki z lokalnym zapisem.');
        const firebase=await sdk();
        if(reset){await deadline(firebase.resetPassword(email));accountNotice='Jeśli dla tego adresu dostępne jest odzyskiwanie hasła, otrzymasz wiadomość. Sprawdź też spam.';}
        else {const account=await deadline(firebase.login(email,password,registerAccount,name));await connectAccount(account);accountNotice='Zalogowano. Postępy bez konta są przechowywane osobno.';}
      }catch(error){accountError=firebaseMessage(error);}
      finally{authWorking=false;}
    });return;
  }

  if ((ev.target as HTMLElement).id !== 'answer-form') return;
  ev.preventDefault();
  const input = root.querySelector<HTMLInputElement>('#answer')!;
  if (!input.value.trim()) { input.focus(); return; }
  const proxy = document.createElement('button'); proxy.dataset.answer = input.value;
  void run(() => action('answer',proxy));
});
root.addEventListener('change', async ev => {
  const input = ev.target as HTMLInputElement;
  if (input.name === 'answerMode') answerMode = input.value as AnswerMode;
  if (input.id === 'previous') previous = input.checked;
  if (input.id !== 'import-file') return;
  const file = input.files?.[0];
  if (!file) return;
  await run(async () => {
    pending = null;
    try {
      if (file.size > 50 * 1024 * 1024) throw new Error('Plik jest za duży. Maksymalny rozmiar kopii to 50 MB.');
      pending = await validateFullBackup(JSON.parse(await file.text())); notice = '';
    } catch (err) { notice = err instanceof SyntaxError ? 'Nie można odczytać tego pliku JSON. Wybierz kopię pobraną z aplikacji. Obecne dane pozostają bez zmian.' : (err as Error).message; }
  });
});

async function init() {
  root.innerHTML = '<div class="loading">✳<p>Przygotowujemy Twoją przestrzeń…</p></div>';
  if (!navigator.locks) { root.innerHTML = '<div class="loading"><h1>Zaktualizuj przeglądarkę</h1><p>Ta wersja potrzebuje aktualnej przeglądarki Chrome, Edge, Firefox lub Safari, aby bezpiecznie zapisywać postępy.</p></div>'; return; }
  await navigator.locks.request(`${storageNamespace}:writer`, { ifAvailable: true }, async lock => {
    if (!lock) { root.innerHTML = '<div class="loading"><h1>Nauka jest otwarta w innej karcie</h1><p>Zamknij drugą kartę i odśwież tę stronę. Chronimy w ten sposób Twoje postępy.</p><button class="primary" onclick="location.reload()">Spróbuj ponownie</button></div>'; return; }
    try {
      [modules,catCatalog] = await Promise.all([loadModules(),loadCats()]); selected = modules[0];
      journeys=await loadJourneys(modules).catch(()=>{notice='Kocia mapa jest chwilowo niedostępna. Możesz korzystać z własnych ćwiczeń.';return [];});
      const oldGuest=validateBackup(backup(await load())).progress;
      progress=await prepareProgress(oldGuest);if(JSON.stringify(progress)!==JSON.stringify(oldGuest))await save(progress);
      guestProgress=structuredClone(progress);
      const savedAccount=await readStored<AccountUser>('firebase-user');
      if(savedAccount?.uid){
        await sync.connect(savedAccount.uid,guestProgress);user=savedAccount;progress=structuredClone(sync.cache!.progress);
        if(navigator.onLine)void (async()=>{
          try{const account=await deadline((await sdk()).restoreUser());
            if(account?.uid===savedAccount.uid){await rememberAccount(account);scheduleSync(0);}
            else {reauthNeeded=true;accountError='Zaloguj się ponownie, aby zsynchronizować zapisane wyniki konta.';sync.status='error';}
          }catch(error){accountError='Połączenie z kontem jest niedostępne. Możesz uczyć się z lokalnym zapisem konta.';sync.status='error';}
          if(ready && !busy && (screen==='account'||screen==='home'||screen==='journeys'))render();else refreshSyncLabel();
        })();
      }
      ready = true; render();
      scheduleReviewMigration();
      startPwa(()=>{if(ready && !busy && screen==='home')render();});
    }
    catch (err) {
      root.innerHTML = `<div class="loading"><h1>Nie możemy wczytać aplikacji</h1><p>Nie zmieniliśmy Twoich postępów. Sprawdź pliki materiałów, połączenie i zgodę przeglądarki na zapis danych, a następnie odśwież stronę.</p><p>${e(err instanceof Error ? err.message : 'Błąd odczytu')}</p></div>`;
      console.error(err); return;
    }
    // Blokada jest zwalniana przez przeglądarkę przy zamknięciu dokumentu.
    await new Promise<void>(() => {});
  });
}
window.addEventListener('online',()=>{if(sync.cache?.dirty || !progress.active)scheduleSync(0);});
window.addEventListener('focus',()=>{if(user && !progress.active)scheduleSync(0);});
window.addEventListener('online',scheduleReviewMigration);
window.addEventListener('focus',scheduleReviewMigration);
void init();
