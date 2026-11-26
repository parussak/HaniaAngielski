import type {OwnerCall} from '../app/action-payloads.ts';
import {isOwnedBy,unhandled} from '../app/actions.ts';
import type {Progress} from '../learning/model.ts';
import {completedTasks,type TaskPreview} from '../learning/task-progress.ts';

/** `progress` jest tylko czytany: kontroler nie ma portu zapisu, więc podgląd nie może nic zmienić. */
export interface TaskPreviewState {
    readonly progress: Pick<Progress, 'active'>;
    taskPreview?: TaskPreview;
}
export function createTaskPreviewController(state: TaskPreviewState) {
    function handleAction(...[action, payload]: OwnerCall<'preview'>): boolean {
        if(!isOwnedBy('preview',action))return false;
        switch(action){
        case 'task-preview':{
            const s = state.progress.active;
            if (s && completedTasks(s).has(payload.task)) state.taskPreview = {sessionId: s.id, position: payload.task};
            return true;
        }
        case 'task-preview-close':{
            state.taskPreview = undefined;
            return true;
        }
        default:return unhandled(action);
        }
    }
    return { handleAction };
}
