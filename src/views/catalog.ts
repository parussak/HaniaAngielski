import { lessons, stars, type Journey, type JourneyIssue } from '../adventure.ts';
import type { Module, Progress } from '../core.ts';
import { e, icon } from '../ui.ts';
import { mapProgress,reviewProgressText } from '../learning/map-progress.ts';
import { journeyKey } from '../adventure.ts';
function moduleSubtitle(m: Module) { return [m.level, `Moduł ${m.order}`, m.cover].filter(Boolean).map(e).join(' · '); }
export function journeyList(modules: Module[], journeys: Journey[], progress: Progress,issues:JourneyIssue[]=[],courseId?:string) {
    return `<button class="back" data-action="home">← Moja nauka</button>
    <div class="journey-top">
    <div>
    <div class="eyebrow">MAŁE KROKI, WIELKIE PRZYGODY</div>
    <h1>Twoje kocie przygody</h1>
    </div>
    <button class="star-wallet" data-action="house" aria-label="Koci domek, ${stars(progress,courseId)} gwiazdek">${stars(progress,courseId)} <span aria-hidden="true">★</span>
    </button>
    </div>
    <p class="lead">Wybierz mapę. Ucz się małymi krokami i zdobywaj gwiazdki do kociego domku.</p>
    ${modules.filter(m=>issues.some(issue=>issue.moduleId===m.id)).map(m=>`<section class="panel map-load-error" role="status"><h2>Nie wszystkie mapy są dostępne</h2><p>Moduł: ${e(m.name)}. Pozostałe mapy i ćwiczenia możesz nadal otwierać. Zapisane postępy i gwiazdki zostają.</p><button class="secondary" data-action="retry-maps">Spróbuj wczytać mapy ponownie</button></section>`).join('')}
    <div class="journey-catalog">${journeys.map(j => {
        const m = modules.find(m => m.id === j.moduleId)!;
        const done = lessons(j).filter(l => progress.adventure?.completed[l.key]).length, total = lessons(j).length, reviews = mapProgress(j,progress);
        return `<article class="adventure-invite">
    <div>
    <p class="catalog-subtitle">${moduleSubtitle(m)}</p>
    <h2>${e(j.title)}</h2>
    <p>${done} z ${total} lekcji ukończonych</p>
    <div class="journey-progress ${reviews.complete?'is-mastered':''}" role="progressbar" aria-label="Ukończone lekcje: ${e(j.title)}" aria-valuenow="${done}" aria-valuemin="0" aria-valuemax="${total}">
    <span style="width:${reviews.percent}%">
    </span>
    </div>
    <p class="retention-overview ${reviews.complete?'is-mastered':''}">${e(reviewProgressText(reviews))}</p>
    <button class="primary" data-action="map" data-id="${e(j.moduleId)}" data-journey="${e(journeyKey(j))}" aria-label="Otwórz mapę ${e(j.title)}">Otwórz mapę ${icon('arrow')}</button>
    </div>
    <img src="./illustrations/word-have-a-picnic.svg" alt="" width="110" height="100">
    </article>`;
    }).join('') || '<p class="empty">Nowe przygody pojawią się tutaj, gdy dodamy mapy modułów.</p>'}</div>`;
}
export function moduleList(modules: Module[]) {
    return `<button class="back" data-action="home">← Moja nauka</button>
    <h1>Ćwicz po swojemu</h1>
    <p class="lead">Wybierz moduł, a potem fiszki, quiz, gramatykę, rozmówki lub powtórkę.</p>
    <section class="modules-section">
    <div class="section-heading">
    <div>
    <h2>Twoje moduły <span class="count">${modules.length}</span>
    </h2>
    <p>Wybierz mały kawałek świata do odkrycia.</p>
    </div>
    <span class="section-hint">${icon('book')} Biblioteczka wiedzy</span>
    </div>
    <div class="modules-grid">${modules.map(m => `<article class="module-card">
    <div class="module-cover">
    <span class="module-number">MODUŁ ${m.order.toString().padStart(2, '0')}</span>
    <span class="cover-letters">${e(m.cover)}</span>
    <span class="cover-flower">${icon('cat')}</span>
    <span class="demo-badge">${e(m.label)}</span>
    </div>
    <div class="module-body">
    <div class="module-meta">${e(m.language)} <span>•</span> Moduł ${m.order}</div>
    <h3>${e(m.name)}</h3>
    <p>${e(m.subtitle)}</p>
    <div class="topic-tags">${m.topics.map(t => `<span>${e(t)}</span>`).join('')}</div>
    <div class="module-bottom">
    <span>${m.basicFlashcardIds?.length ?? m.words.length} podstawowych / ${m.words.length} wszystkich fiszek <br>${m.exercises.length} zadań</span>
    <button class="round-button" data-action="module" data-id="${e(m.id)}" aria-label="Otwórz moduł ${e(m.name)}">${icon('arrow')}</button>
    </div>
    </div>
    </article>`).join('')}<article class="coming-card">
    <span class="coming-icon">${icon('spark')}</span>
    <h3>Miejsce na nowe odkrycia</h3>
    <p>Tu pojawią się kolejne moduły <br>z Twojego podręcznika.</p>
    <span class="soft-tag">Wkrótce, z Twoich materiałów</span>
    </article>
    </div>
    </section>`;
}
