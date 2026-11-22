import type { AppState } from '../app/state.ts';
import { courseModules, currentCourse } from '../app/selectors.ts';
import { grammarTopics, type GrammarRuleEntry, type GrammarTopicEntry } from '../learning/grammar-topics.ts';
import { targetLanguage } from '../learning/scope.ts';
import { button, e } from '../ui.ts';
import { courseContext } from './courses.ts';

const percent = (correct: number, attempts: number) => Math.round(correct / attempts * 100);
const stat = (attempts: number, correct: number) => `ćwiczone ${attempts}×, ${percent(correct, attempts)}% poprawnych`;

function lessonLinks(entry: GrammarRuleEntry) {
    if (!entry.lessons.length) return '';
    return `<div class="grammar-lessons"><strong>Gdzie ćwiczyć:</strong> ${entry.lessons.map(l => `<button class="text-button" data-action="grammar-lesson" data-module="${e(l.moduleId)}" data-journey="${e(l.journeyKey)}" data-id="${e(l.lessonId)}">${e(l.title)}</button>`).join(' ')}</div>`;
}

function ruleView(state: Readonly<AppState>, entry: GrammarRuleEntry) {
    const module = state.modules.find(m => m.id === entry.moduleId)!;
    return `<section class="grammar-rule"><h3>${e(entry.rule.title)}</h3><p class="muted">${e(module.name)} · ${stat(entry.attempts, entry.correct)}</p><p>${e(entry.rule.explanation)}</p><ul lang="${e(targetLanguage(module))}">${entry.rule.examples.map(x => `<li>${e(x)}</li>`).join('')}</ul>${lessonLinks(entry)}</section>`;
}

function topicView(state: Readonly<AppState>, entry: GrammarTopicEntry) {
    const searchableText = [entry.topic.title, entry.topic.summary, ...entry.rules.flatMap(({ rule }) =>
        [rule.title, rule.explanation, ...rule.examples])].join(' ');
    return `<details class="panel grammar-topic" data-grammar-text="${e(searchableText)}"><summary><strong>${e(entry.topic.title)}</strong> <span class="muted">${stat(entry.attempts, entry.correct)}</span></summary>${entry.topic.summary ? `<p>${e(entry.topic.summary)}</p>` : ''}${entry.rules.map(r => ruleView(state, r)).join('')}<button class="primary" data-action="grammar-practice" data-id="${e(entry.topic.id)}">Poćwicz ten temat →</button></details>`;
}

/** D-74: grammar rules of the chosen course, grouped under topics; they appear after the first attempt. */
export function grammarView(state: Readonly<AppState>) {
    const course = currentCourse(state), anchor = courseModules(state)[0];
    const head = `${button('home', '← Moja nauka', 'back')}${courseContext(state)}<h1>Gramatyka</h1>`;
    if (!course || !anchor) return `${head}<p>Ten kurs nie ma dostępnych materiałów.</p>`;
    if (!course.grammarTopics?.length) return `${head}<p class="course-empty" role="status">Ten kurs nie ma jeszcze zebranych tematów gramatyki.</p>`;
    const topics = grammarTopics(state.modules, anchor, course.grammarTopics, state.journeys, state.progress);
    if (!topics.length) return `${head}<p class="course-empty" role="status">Gdy spróbujesz pierwszych zadań z gramatyki, tutaj pojawią się zasady, które już poznajesz.</p>`;
    return `${head}<label class="grammar-search">Szukaj w poznanej gramatyce
        <input type="search" id="grammar-search" placeholder="Temat, zasada lub przykład">
    </label><p class="grammar-search-status" role="status"></p>${topics.map(t => topicView(state, t)).join('')}`;
}
