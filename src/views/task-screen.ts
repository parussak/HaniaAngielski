import type {AppState} from '../app/state.ts';
import {sessionCompatible} from '../learning/questions.ts';
import {previewedTask} from '../learning/task-progress.ts';
import {withReportButton} from './report-dialog.ts';
import {studyView} from './study.ts';
import {studyPage} from './study-page.ts';
import {taskNavigatorView} from './task-navigator.ts';
import {taskPreviewView} from './task-preview.ts';

/** Ekran trwającej sesji: bieżące zadanie albo podgląd ukończonego (D-81), z numerami zadań pod licznikiem. */
export function taskScreenView(state:Readonly<AppState>){
 const s=state.progress.active;
 // Brakujący materiał obsługuje `studyView` swoim komunikatem; numery nie mają wtedy czego otwierać.
 if(!s||!sessionCompatible(state.modules,s))return studyView(state);
 const viewed=previewedTask(s,state.taskPreview);
 // D-80: zgłoszenie dotyczy bieżącego zadania, więc w podglądzie go nie ma.
 if(viewed===undefined)return withReportButton(studyView(state,taskNavigatorView(s)));
 return studyPage(state,{...s,index:viewed},taskPreviewView(state,s,viewed),taskNavigatorView(s,viewed));
}
