import assert from 'node:assert/strict';
import test from 'node:test';
import { emptyProgress, type Progress } from '../src/learning/model.ts';
import { createProgressController, type ProgressState } from '../src/controllers/progress.ts';

// Kontroler dostaje zwykły obiekt z wąskim ProgressState — bez AppState, DOM-u i prawdziwego magazynu.
function narrowState(over: Partial<ProgressState> = {}): ProgressState {
  return {
    progress: emptyProgress(), guestProgress: emptyProgress(), journeys: [], journeyIssues: [], modules: [],
    selectedCourseId: '', user: null, ready: true, busy: false, screen: 'home', notice: '', storageError: 'stary błąd', ...over,
  };
}
function setup(over: Partial<ProgressState> = {}) {
  const log: string[] = [];
  const state = narrowState(over);
  const saved: Progress[] = [];
  const store = {
    save: async (p: Progress) => { log.push('zapis'); saved.push(structuredClone(p)); },
    putHistoryPage: async () => {}, localHistoryPage: async () => undefined,
  };
  const sync = { cache: null as { localVersion: number; progress: Progress } | null, save: async (_p: Progress, _v?: number) => {} };
  const ports = {
    sync, store, run: async (task: () => Promise<void>) => task(), render: () => {}, scheduleSync: () => { log.push('sync'); },
    isOnline: () => true, fetchHistoryPage: async () => { throw new Error('brak'); },
  };
  return { state, log, saved, sync, store, controller: createProgressController(state, ports as never) };
}

test('gość: zmiana idzie na kopii, zapis poprzedza nowy stan, błąd zapisu czyści się po sukcesie', async () => {
  const { state, log, saved, controller } = setup();
  const before = state.progress;
  await controller.mutate(p => { p.encountered = ['a']; });
  assert.equal(saved.length, 1);
  assert.deepEqual(saved[0].encountered, ['a']);
  assert.deepEqual(state.progress.encountered, ['a']);
  assert.notEqual(state.progress, before);
  assert.equal(before.encountered, undefined, 'stary stan nietknięty');
  assert.deepEqual(state.guestProgress, state.progress);
  assert.notEqual(state.guestProgress, state.progress, 'kopia gościa jest osobnym obiektem');
  assert.equal(state.storageError, '');
  assert.deepEqual(log, ['zapis', 'sync']);
});

test('gość: błąd zapisu nie psuje stanu, nie planuje synchronizacji i zachowuje komunikat', async () => {
  const { state, log, store, controller } = setup();
  store.save = async () => { throw new Error('pełny dysk'); };
  const before = structuredClone(state.progress);
  await assert.rejects(controller.mutate(p => { p.encountered = ['a']; }), /pełny dysk/);
  assert.deepEqual(state.progress, before);
  assert.deepEqual(state.guestProgress, emptyProgress());
  assert.equal(state.storageError, 'stary błąd');
  assert.deepEqual(log, []);
});

test('konto: zapis przez synchronizację z oczekiwaną wersją, stan bierze zapisany cache', async () => {
  const { state, log, sync, saved, controller } = setup({ user: { uid: 'u1' } as never });
  sync.cache = { localVersion: 7, progress: emptyProgress() };
  let seenVersion: number | undefined;
  sync.save = async (p, v) => {
    seenVersion = v; log.push('sync.save');
    sync.cache = { localVersion: 8, progress: { ...structuredClone(p), encountered: ['z'] } };
  };
  await controller.mutate(p => { p.encountered = ['a']; });
  assert.equal(seenVersion, 7);
  assert.deepEqual(state.progress.encountered, ['z']);
  assert.notEqual(state.progress, sync.cache.progress);
  assert.equal(saved.length, 0, 'konto nie zapisuje przez magazyn gościa');
  assert.deepEqual(state.guestProgress, emptyProgress());
  assert.deepEqual(log, ['sync.save', 'sync']);
});

test('konto: konflikt wersji odrzuca zmianę, stan i komunikat zostają', async () => {
  const { state, log, sync, controller } = setup({ user: { uid: 'u1' } as never });
  sync.cache = { localVersion: 1, progress: emptyProgress() };
  sync.save = async () => { throw new Error('Wyniki konta zmieniły się w tle. Spróbuj wykonać ten krok ponownie.'); };
  const before = structuredClone(state.progress);
  await assert.rejects(controller.mutate(p => { p.encountered = ['a']; }), /zmieniły się w tle/);
  assert.deepEqual(state.progress, before);
  assert.equal(state.storageError, 'stary błąd');
  assert.deepEqual(log, []);
});

test('dwie zmiany po sobie nie gubią się: druga widzi wynik pierwszej', async () => {
  const { state, controller } = setup();
  await controller.mutate(p => { p.encountered = ['a']; });
  await controller.mutate(p => { assert.deepEqual(p.encountered, ['a']); p.encountered!.push('b'); });
  assert.deepEqual(state.progress.encountered, ['a', 'b']);
});

test('historia: bez internetu i bez konta pobranie brakującej strony kończy się czytelnym błędem', async () => {
  const { controller } = setup();
  await assert.rejects(controller.getHistoryPage('p1'), /nie jest jeszcze pobrana/);
});
