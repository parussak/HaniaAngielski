import type { Module } from '../core.ts';
import { heroArt } from './hero-art.ts';
import type { NextStep } from '../next-step.ts';
import type { PwaState } from '../pwa.ts';
import { button, e, icon } from '../ui.ts';
function pwaCard(pwa: PwaState) {
    const status = pwa.ready ? 'Materiały gotowe do nauki bez internetu.' : pwa.preparing ? 'Pobieramy materiały do nauki bez internetu…' : pwa.failed ? 'Nie udało się pobrać materiałów. Połącz się z internetem i spróbuj ponownie.' : 'Otwórz aplikację z internetem, aby przygotować naukę offline.';
    return `<section class="pwa-card" aria-label="Instalacja i nauka offline"><img src="./icons/cat-192.png" alt="" width="56" height="56"><div><h2>${pwa.installed ? 'Twoja aplikacja do nauki' : 'Małe kroki na Twoim telefonie'}</h2><p data-offline-status>${status}${!pwa.online ? ' Teraz jesteś offline.' : ''}</p><p>Bez internetu ćwiczenia i zapis wyników działają na urządzeniu. Zalogowane konto wyśle wyniki po połączeniu, gdy aplikacja jest otwarta lub przy kolejnym uruchomieniu.</p>${pwa.canInstall && !pwa.installed ? button('pwa-install', 'Zainstaluj aplikację') : ''}${pwa.failed ? button('pwa-prepare', 'Pobierz materiały ponownie', 'secondary') : ''}${!pwa.installed ? '<details><summary>Jak zainstalować na Androidzie?</summary><p>W Chrome otwórz menu ⋮ → Dodaj do ekranu głównego → Zainstaluj. Nazwa opcji może różnić się na telefonie. Jeśli masz już starszy skrót, instaluj z tego samego adresu i przeglądarki — nie czyść danych strony.</p></details>' : ''}</div></section>`;
}
function updateBanner(pwa: PwaState) { return pwa.updateAvailable ? `<section class="update-banner" aria-label="Aktualizacja aplikacji"><span class="update-symbol" aria-hidden="true">${icon('spark')}</span><div><strong>Nowa wersja dostępna</strong><p>Nowe odkrycia czekają. Twoje postępy pozostaną zapisane.</p></div>${button('pwa-update', 'Zaktualizuj', 'secondary')}</section>` : ''; }
function nextStepCard(step: NextStep, modules: Module[], cat: string) {
    const m = modules.find(m => m.id === step.moduleId);
    let title = '', detail = '', description = '', label = '';
    switch (step.kind) {
        case 'resume':
            title = 'Wracamy do nauki?';
            detail = `${m?.cover ?? ''} · ${step.title} · pytanie ${step.question} z ${step.total}`;
            description = 'Twój kotek czeka. Wróć dokładnie tam, gdzie skończyła się ostatnia próba.';
            label = 'Kontynuuj naukę →';
            break;
        case 'lesson':
            title = step.newModule ? 'Czas na kolejną przygodę!' : step.first ? 'Zacznijmy kocią przygodę!' : 'Zróbmy kolejny mały krok!';
            detail = `${m?.cover ?? ''} · ${step.stageTitle} · ${step.title}`;
            description = step.newModule ? 'Poprzedni moduł ukończony. Poznajmy coś nowego!' : step.first ? 'Pierwsza krótka lekcja czeka. Zaczniemy od przykładów.' : 'Kolejna krótka lekcja już czeka. Uczymy się po trochu!';
            label = step.newModule ? 'Zacznij następny moduł →' : step.first ? 'Zacznij pierwszą lekcję →' : 'Zacznij następną lekcję →';
            break;
        case 'stage-review':
            title = 'Lekcje za Tobą — czas je utrwalić!';
            detail = `${m?.cover ?? ''} · Powtórka · ${step.title}`;
            description = `Do utrwalenia: ${step.pending}. Twój koci nauczyciel pomoże Ci poćwiczyć.`;
            label = 'Przejdź do powtórki →';
            break;
        case 'review':
            title = 'Zróbmy małą powtórkę!';
            detail = `${m?.cover ?? ''} · Powtórka błędów`;
            description = `Do powtórzenia: ${step.pending}. Każda próba pomaga zapamiętać więcej.`;
            label = 'Przejdź do powtórki →';
            break;
        case 'unavailable':
            title = 'Twoja nauka jest zapisana';
            detail = 'Rozpoczęta sesja wymaga innej wersji materiałów.';
            description = 'Zapis i historia pozostają zachowane. Możesz sprawdzić dostępne moduły.';
            label = 'Zobacz moduły →';
            break;
        case 'practice':
            title = 'Świetna robota! Co powtórzymy?';
            detail = m ? `${m.cover} · Ćwiczenia po swojemu` : 'Twoja przestrzeń do nauki';
            description = 'Wybierz fiszki, quiz lub gramatykę i poćwicz znany materiał.';
            label = 'Wybierz ćwiczenia →';
            break;
    }
    return `<section class="next-step-card" aria-labelledby="next-step-heading" data-step-kind="${step.kind}"><div class="next-step-copy"><div class="eyebrow">TWÓJ NASTĘPNY KROK</div><h2 id="next-step-heading">${e(title)}</h2><p class="next-step-detail">${e(detail)}</p><p>${e(description)}</p></div><div class="next-step-cat" aria-hidden="true">${cat}</div>${button('next-step', e(label))}</section>`;
}
export interface HomeViewProps {
    name: string | null | undefined;
    modules: Module[];
    step: NextStep;
    pwa: PwaState;
    cat: string;
}
export function homeView({ name, modules, step, pwa, cat }: HomeViewProps) {
    return `<div class="home-start">${updateBanner(pwa)}<section class="welcome">
    <div>
    <h1>Dobrze Cię widzieć${name ? `, ${e(name)}` : ''}!</h1>
    <p>Na co masz dzisiaj ochotę?</p>
    </div>
    </section>${nextStepCard(step, modules, cat)}<section class="hero home-hero">
    <div>
    <span class="tag">TWOJA JĘZYKOWA PRZYGODA</span>
    <h2>Wielkie rzeczy zaczynają się od małych kroków.</h2>
    <p>Wybierz przygodę, ucz się małymi krokami i zdobywaj gwiazdki do kociego domku.</p>${button('journeys', `Wybierz przygodę ${icon('arrow')}`)}</div>${heroArt()}</section>
    <section class="practice-entry">
    <span class="practice-icon" aria-hidden="true">${icon('cards')}</span>
    <div>
    <h2>A może wolisz poćwiczyć po swojemu?</h2>
    <p>Fiszki, quizy, gramatyka, rozmówki i powtórki.</p>${button('module-list', `Przejdź do modułów ${icon('arrow')}`, 'secondary')}</div>
    </section>
    <details class="home-help">
    <summary>${icon('book')} Jak korzystać z aplikacji?</summary>
    <div class="home-help-content">${pwaCard(pwa)}<h2>Twoje wyniki i konto</h2>
    <p>Każda odpowiedź zapisuje się na tym urządzeniu. Konto pozwala korzystać z wyników na różnych urządzeniach. Bez konta możesz przenosić postępy za pomocą pliku kopii.</p>
    <div class="help-actions">${button('account', 'Zarządzaj kontem', 'text-button')}${button('backup', 'Zapisz lub wczytaj kopię', 'text-button')}</div>
    </div>
    </details>
    </div>`;
}
