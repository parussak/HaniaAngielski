import './style.css';
import './theme.css';
import { loadModules } from './content.ts';
import { isFlashcardMode, inputFor, currentStats, optionsFor, backup, emptyProgress, makeSession, questionFor, next, recordAnswer, score, sessionCompatible, validateBackup, type Illustration, type AnswerMode, type Mode, type Module, type Progress, type Session, type Backup } from './core.ts';
import { load, save, storageNamespace } from './storage.ts';

let modules: Module[] = [];
const root = document.querySelector<HTMLDivElement>('#app')!;
let progress: Progress = emptyProgress();
let screen: 'home' | 'setup' | 'study' | 'progress' | 'backup' | 'summary' = 'home';
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
const labels: Record<Mode, string> = { 'flashcards-basic': 'Fiszki podstawa', flashcards: 'Fiszki', quiz: 'Quiz słownictwa', grammar: 'Gramatyka', review: 'Powtórka błędów' };
const e = (value: unknown) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const date = (value: string) => new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
const icons: Record<string, string> = {
  cat: '<path d="M4 11V4l5 3a11 11 0 0 1 6 0l5-3v7c2 9-18 9-16 0Z"/><path d="M8 11h.01M16 11h.01m-5 3 1 1 1-1M2 13l5 1m-5 3 5-1m15-3-5 1m5 3-5-1"/>',
  leaf: '<path d="M19 4C9 3 3 7 5 14c2 6 12 6 14-10Z"/><path d="m6 18 8-9M10 13l-1-4"/>',
  home: '<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>',
  chart: '<path d="M5 20V11m7 9V4m7 16v-6"/>',
  cloud: '<path d="M7 17H6a4 4 0 0 1-1-8 7 7 0 0 1 13-1 5 5 0 0 1 1 9h-2M12 12v9m-3-3 3 3 3-3"/>',
  cards: '<rect x="7" y="4" width="13" height="16" rx="3"/><path d="M4 7v11a4 4 0 0 0 4 4m3-12h5m-5 4h3"/>',
  spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4m-2-2h4"/>',
  book: '<path d="M12 5C8 2 3 4 3 4v15s5-2 9 1c4-3 9-1 9-1V4s-5-2-9 1Zm0 0v15"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  repeat: '<path d="M20 8a8 8 0 0 0-14-3L3 8m0-5v5h5m-4 8a8 8 0 0 0 14 3l3-3m0 5v-5h-5"/>',
};
const icon = (name: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] ?? icons.spark}</svg>`;
const button = (action: string, text: string, cls = 'primary') => `<button class="${cls}" data-action="${action}">${text}</button>`;
function compatible() { return !progress.active || sessionCompatible(modules, progress.active); }
function stats() { return currentStats(modules,progress); }
function shell(content: string) {
  const active = screen === 'progress' ? 'progress' : screen === 'backup' ? 'backup' : 'home';
  return `<aside class="sidebar"><a class="brand" href="#" data-action="home"><span class="brand-icon">${icon('cat')}</span><span>małe kroki<span class="brand-sub">PRZESTRZEŃ DO NAUKI</span></span></a><div class="profile"><span class="avatar">H</span><div><strong>Hania</strong><span>Twój własny rytm nauki</span></div><span class="tiny-flower">✳</span></div><span class="nav-label">TWOJA PRZESTRZEŃ</span><nav aria-label="Główna nawigacja">${[['home','home','Moja nauka'],['progress','chart','Moje postępy'],['backup','cloud','Kopia postępów']].map(([action,i,label]) => `<button class="nav-item ${active === action ? 'active' : ''}" data-action="${action}" ${active === action ? 'aria-current="page"' : ''}>${icon(i)}${label}${active === action ? '<span class="nav-dot"></span>' : ''}</button>`).join('')}</nav><div class="sidebar-note"><span>✦</span><strong>Po trochu, każdego dnia.</strong><p>Każda próba to mały krok do przodu.</p></div><div class="local-note">${icon('check')} Postępy na tym urządzeniu<span>Bez konta. W Twojej przeglądarce.</span></div></aside><main><header class="topbar"><span>NAUKA JĘZYKA / <b>${screen === 'backup' ? 'KOPIA POSTĘPÓW' : screen === 'progress' ? 'POSTĘPY' : 'MOJA NAUKA'}</b></span><span class="local-chip"><span></span> ${storageError ? 'Problem z zapisem' : 'Zapis lokalny'}</span></header>${storageError ? `<div class="alert error" role="alert">${e(storageError)}</div>` : ''}${notice ? `<div class="alert" role="status">${e(notice)}</div>` : ''}<div class="content">${content}</div><footer>Stworzone do nauki, bez pośpiechu. <span>Małe kroki, wielkie odkrycia ✦</span></footer></main>`;
}
function heroArt() {
  return `<div class="hero-art cat-art" aria-hidden="true"><svg class="cat-illustration" viewBox="0 0 300 260" fill="none"><circle cx="154" cy="133" r="109" fill="#E6E8FF"/><circle cx="154" cy="133" r="91" stroke="#C4B5EB" stroke-dasharray="4 7"/><path d="M217 204c58 10 58-43 33-37-19 5 13 20-15 23" stroke="#9B83D2" stroke-width="17" stroke-linecap="round"/><ellipse cx="159" cy="196" rx="64" ry="35" fill="#AB91DC"/><path d="M96 100 91 40c0-4 4-6 7-3l39 33c13-3 25-3 38 0l39-33c4-3 8-1 7 4l-5 61c26 73-147 78-120-2Z" fill="#BDA6EB" stroke="#9174C6" stroke-width="2"/><path d="m101 55 4 34 20-12-24-22Zm108 0-25 22 20 11 5-33Z" fill="#F7B6DA"/><path d="M129 107c-5-6-10-6-15 0m65 0c5-6 10-6 15 0" stroke="#554172" stroke-width="4" stroke-linecap="round"/><ellipse cx="110" cy="120" rx="11" ry="6" fill="#EEA2D0"/><ellipse cx="199" cy="120" rx="11" ry="6" fill="#EEA2D0"/><path d="m150 116 5 5 5-5h-10Z" fill="#76508D"/><path d="M155 121c0 10-12 11-13 4m13-4c0 10 12 11 13 4M87 112l21 4m-23 6 21 1m117-11-21 4m23 6-21 1" stroke="#76508D" stroke-width="2" stroke-linecap="round"/><path d="M102 166c17-3 36 1 53 10 17-9 36-13 54-10v64c-20-4-38 0-54 7-17-7-35-11-53-7v-64Z" fill="#FEFCFF" stroke="#8263B7" stroke-width="2"/><path d="M155 176v61m-40-54 27 6m-27 6 27 6m25-12 27-6m-27 18 27-6" stroke="#CCB6E7" stroke-width="3" stroke-linecap="round"/><ellipse cx="100" cy="185" rx="12" ry="18" fill="#BDA6EB" transform="rotate(-18 100 185)"/><ellipse cx="209" cy="185" rx="12" ry="18" fill="#BDA6EB" transform="rotate(18 209 185)"/><path d="m44 66 4 11 11 4-11 4-4 11-4-11-11-4 11-4ZM249 70l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="#E59CC9"/><circle cx="55" cy="184" r="6" fill="#97C9F3"/><circle cx="239" cy="117" r="4" fill="#97C9F3"/><path d="M144 38c-15-16-26 4 0 17 26-13 15-33 0-17Z" fill="#F1A5D3"/></svg></div>`;
}
function home() {
  const s = stats();
  return `<section class="welcome"><div><div class="eyebrow">DOBRZE CIĘ WIDZIEĆ</div><h1>Cześć, Haniu <span class="wave">🐾</span></h1><p>Na co masz dzisiaj ochotę? Zróbmy mały krok do przodu.</p></div><span class="date-pill">Twoja przestrzeń do odkrywania</span></section><section class="hero"><div><span class="tag">TWOJA JĘZYKOWA PRZYGODA</span><h2>Wielkie rzeczy zaczynają się <br>od małych kroków.</h2><p>Kilka słówek, jedno odkrycie i odrobina praktyki. <br>Ucz się po swojemu — bez pośpiechu.</p>${button('quick-start', `Zaczynamy ${icon('arrow')}`)}</div>${heroArt()}</section><section class="stats-grid" aria-label="Twoje statystyki"><article><span class="stat-icon peach">${icon('book')}</span><div><strong>${s.known}<small> / ${modules.reduce((n,m) => n+m.words.length,0)}</small></strong><span>Znane fiszki</span></div></article><article><span class="stat-icon lavender">${icon('check')}</span><div><strong>${progress.sessions.length}</strong><span>Ukończone sesje</span></div></article><article><span class="stat-icon mint">${icon('chart')}</span><div><strong>${s.accuracy === null ? '—' : `${s.accuracy}%`}</strong><span>Poprawnie za pierwszym razem</span></div></article></section>${progress.active ? `<section class="resume"><div>${icon('repeat')}<div><strong>Twoja nauka czeka</strong><p>${compatible() ? `${e(labels[progress.active.mode])} · wróć dokładnie tam, gdzie skończyłaś.` : 'Zapisana sesja wymaga innej wersji materiałów. Historia pozostaje zachowana.'}</p></div></div>${compatible() ? button('resume','Kontynuuj','secondary') : ''}</section>` : ''}<section class="modules-section"><div class="section-heading"><div><h2>Twoje moduły <span class="count">${modules.length}</span></h2><p>Wybierz mały kawałek świata do odkrycia.</p></div><span class="section-hint">${icon('book')} Biblioteczka wiedzy</span></div><div class="modules-grid">${modules.map(m => `<article class="module-card"><div class="module-cover"><span class="module-number">MODUŁ ${m.order.toString().padStart(2,'0')}</span><span class="cover-letters">${e(m.cover)}</span><span class="cover-flower">${icon('cat')}</span><span class="demo-badge">${e(m.label)}</span></div><div class="module-body"><div class="module-meta">${e(m.language)} <span>•</span> Moduł ${m.order}</div><h3>${e(m.name)}</h3><p>${e(m.subtitle)}</p><div class="topic-tags">${m.topics.map(t => `<span>${e(t)}</span>`).join('')}</div><div class="module-bottom"><span>${m.basicFlashcardIds?.length ?? m.words.length} podstawowych / ${m.words.length} wszystkich fiszek<br>${m.exercises.length} zadań</span><button class="round-button" data-action="module" data-id="${e(m.id)}" aria-label="Otwórz moduł ${e(m.name)}">${icon('arrow')}</button></div></div></article>`).join('')}<article class="coming-card"><span class="coming-icon">${icon('spark')}</span><h3>Miejsce na nowe odkrycia</h3><p>Tu pojawią się kolejne moduły<br>z Twojego podręcznika.</p><span class="soft-tag">Wkrótce, z Twoich materiałów</span></article></div></section><div class="demo-note">${icon('book')} Uczysz się z materiałów z Twojego podręcznika. Wybierz moduł i swój sposób nauki.</div>`;
}
function setup() {
  const descriptions: Record<Mode,string> = { 'flashcards-basic': `${selected.basicFlashcardIds?.length ?? selected.words.length} haseł z ramek Vocabulary. Dobry zestaw na początek.`, flashcards: `Wszystkie ${selected.words.length} haseł z modułu, także dodatkowe słówka i zwroty.`, quiz: 'Sprawdź słówka w krótkich pytaniach.', grammar: 'Buduj zdania, próbuj i poznawaj zasady.', review: 'Wróć do zadań, które sprawiły trudność.' };
  return `<button class="back" data-action="home">← Moja nauka</button><div class="eyebrow">MODUŁ ${selected.order} · ${e(selected.label)}</div><h1>${e(selected.name)}</h1><p class="lead">Wybierz sposób odpowiedzi, potem dotknij kafelka i ćwicz.</p><section class="panel"><fieldset><legend>Sposób odpowiadania</legend><div class="segmented">${([['choice','Wybieram odpowiedź'],['text','Wpisuję odpowiedź'],['mixed','Trochę wybieram, trochę wpisuję']] as const).map(([v,l]) => `<label><input type="radio" name="answerMode" value="${v}" ${answerMode === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></fieldset>${progress.active ? `<div class="alert">Masz rozpoczętą sesję.${compatible() ? button('resume','Wróć do rozpoczętej sesji','text-button') : ''}</div>` : ''}<h2>Dotknij i zacznij</h2><div class="mode-grid">${(Object.keys(labels) as Mode[]).map(m => `<button data-action="mode" data-mode="${m}" aria-label="${labels[m]}" aria-describedby="mode-description-${m}" class="mode-card"><span class="stat-icon ${isFlashcardMode(m) ? 'peach' : m === 'grammar' ? 'lavender' : 'mint'}">${icon(isFlashcardMode(m) ? 'cards' : m === 'review' ? 'repeat' : m === 'grammar' ? 'book' : 'spark')}</span><strong>${labels[m]} →</strong><span id="mode-description-${m}">${descriptions[m]}</span></button>`).join('')}</div><details class="session-settings"><summary>Zakres sesji i materiały</summary><label class="checkbox"><input id="previous" type="checkbox" ${previous ? 'checked' : ''}> Dołącz powtórkę wcześniejszych modułów</label><p>Do 10 pytań w sesji. Trudniejsze zadania wrócą jeszcze raz.${!modules.some(m => m.order < selected.order) ? ' Nie dodano jeszcze wcześniejszych modułów.' : ''}</p><p>${e(selected.source)}</p></details></section><section class="panel grammar-guide"><h2>Przypomnij sobie zasady</h2><p>Krótka ściąga z tego modułu. Rozwiń temat, który chcesz powtórzyć.</p>${selected.grammar.map(rule => `<details><summary>${e(rule.title)}</summary><p>${e(rule.explanation)}</p><ul>${rule.examples.map(example=>`<li>${e(example)}</li>`).join('')}</ul><p class="source-reference">${e(rule.source)}</p></details>`).join('')}</section>`;
}
function illustrationView(picture: Illustration | undefined, showCaption: boolean) {
  if (!picture) return '';
  return `<figure class="answer-illustration ${showCaption ? '' : 'question-illustration'}" ${showCaption ? '' : 'aria-hidden="true"'}>${picture.src ? `<img src="${e(new URL(picture.src,document.baseURI).href)}" alt="${showCaption ? e(picture.caption) : ''}" width="200" height="140">` : `<span role="img" aria-label="${showCaption ? e(picture.caption) : ''}">${e(picture.symbol)}</span>`}${showCaption ? `<figcaption>${e(picture.caption)}</figcaption>` : ''}</figure>`;
}
function study() {
  const s = progress.active;
  if (!s) return `<h1>Sesja zakończona</h1>${button('home','Wróć do modułów')}`;
  if (!sessionCompatible(modules,s)) return `<h1>Potrzebny jest moduł</h1><p>Ta sesja pochodzi z innej wersji materiału lub brakującego modułu. Jej zapis i Twoja historia są bezpieczne. Możesz zapisać kopię albo rozpocząć nową sesję z dostępnego modułu.</p>${button('backup','Kopia postępów')}${button('home','Moja nauka','secondary')}`;
  const item = s.items[s.index];
  const q = questionFor(modules,item);
  const percent = Math.round(s.index / s.items.length * 100);
  let card = '';
  card = `<div class="exercise-label">${icon(item.type === 'word' ? 'cards' : q.kind === 'grammar' ? 'book' : 'spark')} ${item.type === 'word' ? 'FISZKA · PODAJ PO ANGIELSKU' : q.kind === 'grammar' ? 'MAŁY KROK W GRAMATYCE' : 'SŁÓWKO PO SŁÓWKU'}</div><h2 class="question">${e(q.prompt)}</h2>`;
  if (s.phase === 'feedback') {
    const ok = s.lastCorrect;
    card += `<div class="feedback ${ok ? 'correct' : 'incorrect'}" role="status"><strong>${ok ? 'Tak jest! Dobra robota ✦' : 'Spokojnie, tak właśnie się uczymy.'}</strong>${!ok ? `<p>Poprawna odpowiedź: <b>${e(q.answers[0])}</b></p>` : ''}<p>${e(q.explanation)}</p>${q.source ? `<p class="source-reference">Źródło: ${e(q.source)}</p>` : ''}${illustrationView(q.illustration,true)}</div><div class="actions">${!ok ? button('retry','Spróbuję jeszcze raz','secondary') : ''}${button('next',`Dalej ${icon('arrow')}`)}</div>`;
  } else {
    card += illustrationView(q.illustration,false);
    card += s.phase === 'retry' ? '<p class="retry-note">Teraz spróbuj ponownie. Pierwszy wynik pozostanie zapisany osobno.</p>' : '<p>Nie musisz wiedzieć wszystkiego. Po prostu spróbuj.</p>';
    card += inputFor(q,item.input) === 'choice' ? `<div class="answer-options">${optionsFor(q,s).map((o,i) => `<button class="option" data-action="answer" data-answer="${e(o)}"><span aria-hidden="true">${String.fromCharCode(65+i)}</span>${e(o)}</button>`).join('')}</div>` : `<form id="answer-form"><label for="answer" class="sr-only">Twoja odpowiedź</label><input id="answer" name="answer" class="answer-input" placeholder="Wpisz odpowiedź…" autocomplete="off" autocorrect="off" enterkeyhint="done" autocapitalize="off" spellcheck="false" maxlength="500" required><button class="primary" type="submit">Sprawdź ${icon('check')}</button></form>`;
  }
  return `<button class="back" data-action="home">← Wróć do modułów · sesja zostaje zapisana</button><div class="study-heading"><div><div class="eyebrow">TWÓJ MAŁY KROK</div><h1>${labels[s.mode]}</h1></div><span class="tag">${s.index + 1} / ${s.items.length}</span></div><div class="progress-track" role="progressbar" aria-label="Pytanie ${s.index + 1} z ${s.items.length}" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><span style="width:${percent}%"></span></div><section class="study-card">${card}</section><p class="under-card">${icon('check')} ${storageError ? 'Zapis niedostępny — zapisz kopię przed zamknięciem.' : 'Każdy krok zapisuje się na tym urządzeniu.'}</p>`;
}
function summary() {
  const s = lastSession ?? progress.sessions.at(-1);
  if (!s) return home();
  const result = score(s);
  return `<section class="summary panel"><div class="celebration">${icon('cat')}</div><div class="eyebrow">KOLEJNY MAŁY KROK ZA TOBĄ</div><h1>Dobra robota, Haniu!</h1><p>Każda próba pomaga. Dziś wiesz już trochę więcej.</p>${!s.attempts.length ? `<div class="summary-score">${new Set(s.items.map(i => i.key)).size}<span>przećwiczonych fiszek</span></div>` : `<div class="summary-score">${result.correct}<small> / ${result.total}</small><span>poprawnie za pierwszym razem</span></div><p>Poprawione za drugim razem: <b>${result.corrections}</b>. Ten wynik liczymy osobno.</p>`}<div class="actions">${button('home','Wróć do modułów')}${button('progress','Zobacz postępy','secondary')}</div></section>`;
}
function progressView() {
  const s = stats();
  return `<div class="eyebrow">WSZYSTKIE MAŁE KROKI SIĘ LICZĄ</div><h1>Twoje postępy</h1><p class="lead">Tu zobaczysz, co już potrafisz i do czego warto wrócić.</p><section class="stats-grid"><article><span class="stat-icon peach">${icon('cards')}</span><div><strong>${s.known}</strong><span>Znane fiszki</span></div></article><article><span class="stat-icon lavender">${icon('repeat')}</span><div><strong>${s.review}</strong><span>Rzeczy do powtórki</span></div></article><article><span class="stat-icon mint">${icon('chart')}</span><div><strong>${s.accuracy === null ? '—' : `${s.accuracy}%`}</strong><span>Pierwsze odpowiedzi</span></div></article></section><section class="panel"><h2>Moduł po module</h2>${modules.map(m => { const sessions = progress.sessions.filter(s => s.moduleId === m.id); const all = sessions.flatMap(s => s.attempts); return `<div class="history-row"><div><strong>${e(m.name)}</strong><span>${sessions.length} ukończonych sesji · ${all.length ? `${Math.round(all.filter(a => a.first).length/all.length*100)}% pierwszych odpowiedzi` : 'Jeszcze bez ocenionych odpowiedzi'}</span></div><button class="secondary" data-action="module" data-id="${e(m.id)}">Poćwicz</button></div>`; }).join('')}</section><section class="panel"><h2>Historia nauki</h2>${!progress.sessions.length ? `<div class="empty">${icon('leaf')}<h3>Tu wyrosną Twoje postępy</h3><p>Zacznij pierwszą sesję. Nie trzeba od razu umieć wszystkiego.</p>${button('home','Wybierz moduł')}</div>` : [...progress.sessions].reverse().map(session => { const result = score(session); const m = modules.find(m => m.id === session.moduleId); return `<div class="history-row"><div><strong>${e(labels[session.mode])} · ${e(m?.name ?? 'Moduł spoza biblioteczki')}</strong><span>${date(session.completedAt!)}${!m || !sessionCompatible(modules,session) ? ' · archiwalny materiał' : ''}</span></div><div class="history-score">${!session.attempts.length ? `${new Set(session.items.map(i=>i.key)).size} fiszek` : `${result.correct}/${result.total}`}<small>${!session.attempts.length ? 'przećwiczonych' : `pierwsze próby · ${result.corrections} poprawionych`}</small></div></div>`; }).join('')}</section>`;
}
function backupView() {
  return `<div class="eyebrow">TWOJA NAUKA, BEZPIECZNIE</div><h1>Kopia postępów</h1><p class="lead">Zachowaj swoje małe kroki albo zabierz je na inne urządzenie.</p><div class="backup-grid"><section class="panel"><span class="stat-icon mint">${icon('cloud')}</span><h2>Zapisz kopię</h2><p>Pobierz plik z wynikami, historią, fiszkami i rozpoczętą sesją. Schowaj go w bezpiecznym miejscu.</p>${button('export','Zapisz kopię postępów')}</section><section class="panel"><span class="stat-icon lavender">${icon('repeat')}</span><h2>Wczytaj kopię</h2><p>Wybierz wcześniej zapisany plik. Najpierw go sprawdzimy, a potem poprosimy o potwierdzenie.</p><label class="secondary file-label">Wybierz plik kopii<input type="file" id="import-file" accept=".json,application/json"></label></section></div><section class="panel note-panel"><h2>Warto wiedzieć</h2><p>Postępy są zapisane tylko w tej przeglądarce. Wyczyszczenie danych strony może je usunąć. Przenoszenie na inne urządzenie odbywa się przez plik kopii, bez automatycznej synchronizacji.</p><p>Kopia nie zawiera modułów ani zdjęć książki. Brakujący moduł nie usuwa wyników, ale do dalszej nauki potrzebne są jego materiały.</p></section>${pending ? `<section class="panel import-confirm" role="region" aria-label="Potwierdzenie importu"><h2>Wczytać tę kopię?</h2><p>Kopia z <strong>${date(pending.exportedAt)}</strong>, ukończone sesje: <strong>${pending.progress.sessions.length}</strong>.</p><p>Wczytanie <strong>zastąpi wszystkie obecne postępy</strong>. Pliki nie zostaną połączone.</p>${pending.progress.active && !sessionCompatible(modules,pending.progress.active) ? '<p>Zapisana sesja wymaga brakującego lub zmienionego modułu. Zachowamy ją, ale na razie nie będzie można jej wznowić.</p>' : ''}<div class="actions">${button('export','Najpierw zapisz obecne','secondary')}${button('confirm-import','Zastąp postępy')}${button('cancel-import','Anuluj','text-button')}</div></section>` : ''}`;
}
function render() {
  document.body.classList.toggle('studying',screen==='study');
  const focused = document.activeElement as HTMLElement | null;
  const focusAction = focused?.dataset.action;
  const focusId = focused?.id;
  const changedScreen = renderedScreen !== screen;
  root.innerHTML = shell(({ home, setup, study, progress: progressView, backup: backupView, summary }[screen])());
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
  const draft = structuredClone(progress);
  change(draft);
  await save(draft);
  progress = draft; storageError = '';
}
function exportProgress() {
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup(progress), null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = `hania-postepy-${new Date().toISOString().slice(0,10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  notice = 'Plik kopii został przygotowany do pobrania. Zachowaj go, aby móc odtworzyć postępy.';
}
async function action(action: string, el: HTMLElement) {
  notice = '';
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
    await mutate(p => { recordAnswer(p,q,el.dataset.answer ?? ''); });
  } else if (action === 'retry') await mutate(p => { if (p.active?.phase === 'feedback' && p.active.lastCorrect === false) { p.active.phase = 'retry'; p.active.lastCorrect = null; } });
  else if (action === 'next') { await mutate(p => { if (p.active?.phase === 'feedback') next(p); }); if (!progress.active) { lastSession = progress.sessions.at(-1)!; screen = 'summary'; } }
  else if (action === 'export') exportProgress();
  else if (action === 'cancel-import') pending = null;
  else if (action === 'confirm-import' && pending) { const imported = validateBackup(pending).progress; await save(imported); progress = imported; pending = null; storageError = ''; notice = 'Kopia została wczytana. Twoje postępy są już na tym urządzeniu.'; }
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
      if (file.size > 5 * 1024 * 1024) throw new Error('Plik jest za duży. Maksymalny rozmiar kopii to 5 MB.');
      pending = validateBackup(JSON.parse(await file.text())); notice = '';
    } catch (err) { notice = err instanceof SyntaxError ? 'Nie można odczytać tego pliku JSON. Wybierz kopię pobraną z aplikacji. Obecne dane pozostają bez zmian.' : (err as Error).message; }
  });
});

async function init() {
  root.innerHTML = '<div class="loading">✳<p>Przygotowujemy Twoją przestrzeń…</p></div>';
  if (!navigator.locks) { root.innerHTML = '<div class="loading"><h1>Zaktualizuj przeglądarkę</h1><p>Ta wersja potrzebuje aktualnej przeglądarki Chrome, Edge, Firefox lub Safari, aby bezpiecznie zapisywać postępy.</p></div>'; return; }
  await navigator.locks.request(`${storageNamespace}:writer`, { ifAvailable: true }, async lock => {
    if (!lock) { root.innerHTML = '<div class="loading"><h1>Nauka jest otwarta w innej karcie</h1><p>Zamknij drugą kartę i odśwież tę stronę. Chronimy w ten sposób Twoje postępy.</p><button class="primary" onclick="location.reload()">Spróbuj ponownie</button></div>'; return; }
    try {
      modules = await loadModules(); selected = modules[0];
      progress = validateBackup(backup(await load())).progress; ready = true; render();
    }
    catch (err) {
      root.innerHTML = `<div class="loading"><h1>Nie możemy wczytać aplikacji</h1><p>Nie zmieniliśmy Twoich postępów. Sprawdź pliki materiałów, połączenie i zgodę przeglądarki na zapis danych, a następnie odśwież stronę.</p><p>${e(err instanceof Error ? err.message : 'Błąd odczytu')}</p></div>`;
      console.error(err); return;
    }
    // Blokada jest zwalniana przez przeglądarkę przy zamknięciu dokumentu.
    await new Promise<void>(() => {});
  });
}
void init();
