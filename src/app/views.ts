import {houseView} from '../views/house.ts';
import { accountView as renderAccountView, listeningSettingsView } from '../views/account.ts';
import { journeyView, lessonIntro } from '../adventure-view.ts';
import { lessons,journeyKey } from '../adventure.ts';
import { currentJourney, currentCourse, courseModules, courseJourneys } from './selectors.ts';
import { AppState } from './state.ts';
import { backupView as renderBackupView } from '../views/backup.ts';
import { catView } from '../views/cat.ts';
import { journeyList as renderJourneyList, moduleList as renderModuleList } from '../views/catalog.ts';
import { homeView,updateBanner } from '../views/home.ts';
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
import {warmupView} from '../views/warmup.ts';
import { trainingPreparationView } from '../views/training-preparation.ts';
import {catInvitation} from '../views/cat-invitation.ts';
import {moduleFinished} from '../learning/recall.ts';
export function createViews(state: AppState, sync: ProgressSync, syncLabel: () => string) {
    function decorativeCat(id: string) {
        const cat = state.catCatalog?.cats.find(c => c.id === id);
        return cat ? catView(state.catCatalog, { cat, mood: 'happy', frame: cat.happy }) : icon('cat');
    }
    function invitations(moduleId:string,map?:import('../adventure.ts').Journey){
        const m=state.modules.find(m=>m.id===moduleId)!;
        const ready=!state.journeyIssues.some(issue=>issue.moduleId===moduleId)&&moduleFinished(state.modules,state.journeys,m,state.progress);
        return {
            opening:catInvitation(decorativeCat('albert'),'Kocia rozgrzewka','Do 5 krótkich pytań z poznanego materiału. Rozruszaj łapki przed tą mapą!','module-ritual','Rozgrzej łapki',`data-kind="opening" data-module="${moduleId}" ${map?`data-journey="${journeyKey(map)}"`:''}`),
            finale:catInvitation(decorativeCat('krzywolap'),'Misja Kociego Mistrza',ready?'Wszystkie mapy za Tobą! Do 8 poznanych pytań, jeden mały finał i +1 ★.':'Dobrowolny finał otworzy się po ukończeniu wszystkich map tego modułu.','module-ritual',ready?'Podejmuję misję!':'Najpierw poznaj moduł',`data-kind="finale" data-module="${moduleId}" ${ready?'':'disabled'}`,'finale'),
        };
    }
    function mapView() {
        const j=currentJourney(state);
        if(!j)return '<h1>Kocia mapa</h1><p>Mapa jest chwilowo niedostępna. Twoje własne ćwiczenia nadal działają.</p>'+button('home','Moja nauka');
        const maps=courseJourneys(state).filter(v=>v.moduleId===j.moduleId),cards=invitations(j.moduleId,j);
        return journeyView(j,state.progress,decorativeCat,currentCourse(state)?.id,{opening:cards.opening,...(journeyKey(maps.at(-1)!)===journeyKey(j)?{finale:cards.finale}:{})},state.modules.find(m=>m.id===j.moduleId));
    }
    function introView() {
        const j=currentJourney(state),l=j&&lessons(j).find(l=>l.lesson.id===state.introLessonId)?.lesson,m=state.modules.find(m=>m.id===j?.moduleId);
        if(!j||!l||!m)return mapView();
        if(l.role==='training'&&state.progress.active?.lesson?.id!==`${journeyKey(j)}/${l.id}`&&!mapTrainingPool(state.modules,state.journeys,j,state.progress,l).length)return trainingPreparationView(state.modules,state.journeys,j,state.progress);
        return lessonIntro(j,l,m,state.progress);
    }
    function homeForCats() { return courseContext(state)+houseView(state.progress,currentCourse(state)!.id,state.chosenRoom,state.chosenDecoration,decorativeCat,state.modules,state.journeys,state.journeyIssues,state.houseTab,state.houseEditing); }
    function home() {
        const step = getNextStep(state.modules, state.journeys, state.progress, currentCourse(state)?.id);
        return homeView({ name: state.user ? state.user.displayName : 'Haniu', modules: state.modules, step, pwa, cat: decorativeCat(step.catId), courseContext: courseContext(state) + unfinishedCourseSession(state, true) });
    }
    function journeyList() { return courseContext(state) + renderJourneyList(courseModules(state), courseJourneys(state), state.progress,state.journeyIssues,currentCourse(state)?.id); }
    function moduleList() { return courseContext(state) + renderModuleList(courseModules(state)) + button('course-practice','Ćwicz cały poznany materiał →','secondary'); }
    function setup() { const cards=invitations(state.selected.id);return setupView(state,cards.opening+cards.finale); }
    function study() { return studyView(state); }
    function summary() { return summaryView(state, home); }
    function progressView() { return renderProgressView(state); }
    function backupView() { return renderBackupView(state); }
    function accountView() { return renderAccountView(state, sync, syncLabel()) + listeningSettingsView(courseModules(state)); }
    function shell(content: string) { return shellView(content, state, syncLabel()); }
    const views: Record<AppState['screen'], () => string> = { home, warmup:()=>courseContext(state)+warmupView(state), journeys: journeyList, 'module-list': moduleList, setup, study, progress: progressView, backup: backupView, account: accountView, summary, map: mapView, 'lesson-intro': introView, house: homeForCats, courses: () => coursesView(state), 'course-practice': () => coursePracticeView(state) };
    return () => shell((state.screen!=='home'&&state.screen!=='study'?updateBanner(pwa):'')+views[state.screen]());
}
