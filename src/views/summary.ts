import { AppState } from '../app/state.ts';
import { catView } from './cat.ts';
import { endingCat } from '../cats.ts';
import { sessionTitle } from '../learning-labels.ts';
import { button, e, icon } from '../ui.ts';
import { lessonRatingView } from './lesson-rating.ts';
import { lessonSummaryActions } from './lesson-summary-actions.ts';
// Podsumowanie zakończonej sesji: nagroda, ocena lekcji i dalsze kroki.
export function summaryView(state: Readonly<AppState>, home: () => string) {
    const s = state.lastSession ?? state.progress.sessions.at(-1);
    if (!s)
        return home();

    const warmup=!!s.training||!!s.stageReview||!!s.recall||s.mode==='review';
    return `<section class="summary panel"><div class="celebration">${state.catCatalog ? catView(state.catCatalog, endingCat(state.catCatalog, s), true) : icon('cat')}</div><div class="eyebrow">KOLEJNY MAŁY KROK ZA TOBĄ</div><h1>${s.legendary?'Poziom legendarny ukończony!':warmup?`${sessionTitle(s)} ukończon${s.training?.kind==='map'?'y':'a'}!`:state.user ? state.user.displayName ? `Dobra robota, ${e(state.user.displayName)}!` : 'Dobra robota!' : 'Dobra robota, Haniu!'}</h1><p>${warmup?'Ten krótki zestaw masz za sobą. Możesz odpocząć albo dobrowolnie zrobić następny.':'Każda próba pomaga. Dziś wiesz już trochę więcej.'}</p>${s.lesson || s.stageReview || s.training ? `<div class="lesson-reward">${state.lastReward ? `+${state.lastReward} ★` : s.stageReview ? 'Rozgrzewka ukończona ✓' : s.training ? 'Rozgrzewka ukończona ✓' : 'Lekcja utrwalona ✓'}<small>${state.lastReward ? `Gwiazdki są już w Twoim portfelu.${state.lastStageReward ? ` W tym ${state.lastStageReward} ★ za ukończony etap i utrwalone błędy.` : ''}` : s.stageReview ? 'Ta sesja jest ukończona. Dalsze ćwiczenia są dobrowolne.' : 'Postęp tej sesji jest zachowany.'}</small></div>` : ''}${!s.attempts.length ? `<div class="summary-score">${new Set(s.items.map(i => i.key)).size}<span>przećwiczonych fiszek</span></div>` : lessonRatingView(s)}${warmup&&!s.lesson?button('warmup','Wybierz kolejną rozgrzewkę','secondary'):''}${s.lesson?lessonSummaryActions(state,s):`<div class="actions journey-summary-actions">${s.stageReview ? `${button('map', 'Wróć na mapę')}${button('house', 'Urządź domek', 'secondary')}` : `${s.scope?button('course-practice','Wróć do poznanego materiału'):button('home', 'Wróć do modułów')}${button('progress', 'Zobacz postępy', 'secondary')}`}</div>`}</section>`;
}
