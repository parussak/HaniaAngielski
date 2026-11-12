import {houseView} from '../views/house.ts';
import { accountView as renderAccountView } from '../views/account.ts';
import { journeyView, lessonIntro } from '../adventure-view.ts';
import { lessons } from '../adventure.ts';
import { currentJourney, currentCourse, courseModules, courseJourneys } from './selectors.ts';
import { AppState } from './state.ts';
import { backupView as renderBackupView } from '../views/backup.ts';
import { catView } from '../views/cat.ts';
import { journeyList as renderJourneyList, moduleList as renderModuleList } from '../views/catalog.ts';
import { homeView } from '../views/home.ts';
import { getNextStep } from '../next-step.ts';
import { progressView as renderProgressView } from '../views/progress.ts';
import { pwa } from '../pwa.ts';
import { setupView } from '../views/setup.ts';
import { shellView } from '../views/shell.ts';
import { studyView, summaryView } from '../views/study.ts';
import { ProgressSync } from '../sync.ts';
import { button, icon } from '../ui.ts';
import { coursesView, coursePracticeView, courseContext, unfinishedCourseSession } from '../views/courses.ts';
import { mapTrainingPool } from '../learning/training.ts';
import { trainingPreparationView } from '../views/training-preparation.ts';
export function createViews(state: AppState, sync: ProgressSync, syncLabel: () => string) {
    function decorativeCat(id: string) {
        const cat = state.catCatalog?.cats.find(c => c.id === id);
        return cat ? catView(state.catCatalog, { cat, mood: 'happy', frame: cat.happy }) : icon('cat');
    }
    function mapView() { const j = currentJourney(state); return j ? journeyView(j, state.progress, decorativeCat,currentCourse(state)?.id) : '<h1>Kocia mapa</h1><p>Mapa jest chwilowo niedostępna. Twoje własne ćwiczenia nadal działają.</p>' + button('home', 'Moja nauka'); }
    function introView() {
        const j=currentJourney(state),l=j&&lessons(j).find(l=>l.lesson.id===state.introLessonId)?.lesson,m=state.modules.find(m=>m.id===j?.moduleId);
        if(!j||!l||!m)return mapView();
        if(l.role==='training'&&!mapTrainingPool(state.modules,state.journeys,j,state.progress).length)return trainingPreparationView(state.modules,state.journeys,j,state.progress);
        return lessonIntro(j,l,m,state.progress);
    }
    function homeForCats() { return courseContext(state)+houseView(state.progress,currentCourse(state)!.id,state.chosenRoom,state.chosenDecoration,decorativeCat,state.modules,state.journeys,state.journeyIssues,state.houseTab,state.houseEditing); }
    function home() {
        const step = getNextStep(state.modules, state.journeys, state.progress, currentCourse(state)?.id);
        return homeView({ name: state.user ? state.user.displayName : 'Haniu', modules: state.modules, step, pwa, cat: decorativeCat(step.catId), courseContext: courseContext(state) + unfinishedCourseSession(state, true) });
    }
    function journeyList() { return courseContext(state) + renderJourneyList(courseModules(state), courseJourneys(state), state.progress,state.journeyIssues,currentCourse(state)?.id); }
    function moduleList() { return courseContext(state) + renderModuleList(courseModules(state)) + button('course-practice','Ćwicz cały poznany materiał →','secondary'); }
    function setup() { return setupView(state); }
    function study() { return studyView(state); }
    function summary() { return summaryView(state, home); }
    function progressView() { return renderProgressView(state); }
    function backupView() { return renderBackupView(state); }
    function accountView() { return renderAccountView(state, sync, syncLabel()); }
    function shell(content: string) { return shellView(content, state, syncLabel()); }
    const views: Record<AppState['screen'], () => string> = { home, journeys: journeyList, 'module-list': moduleList, setup, study, progress: progressView, backup: backupView, account: accountView, summary, map: mapView, 'lesson-intro': introView, house: homeForCats, courses: () => coursesView(state), 'course-practice': () => coursePracticeView(state) };
    return () => shell(views[state.screen]());
}
