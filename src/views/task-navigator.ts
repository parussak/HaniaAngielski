import type {Session} from '../learning/model.ts';
import {completedTasks} from '../learning/task-progress.ts';
import {act} from '../ui.ts';

/** D-81: licznik i numery wszystkich zadań. `viewed` to zadanie na ekranie — podglądane albo bieżące. */
export function taskNavigatorView(s:Session,viewed=s.index){
 const done=completedTasks(s),total=s.items.length;
 const numbers=s.items.map((_,position)=>{
  const n=position+1,completed=done.has(position),current=position===viewed,active=position===s.index;
  const action=current?'':completed?act('task-preview',{task:position}):active?act('task-preview-close'):'';
  const state=completed?'ukończone':active?'bieżące':'jeszcze niedostępne';
  return `<li><button type="button" class="task-number${completed?' is-done':''}" id="task-number-${n}" ${action} ${current?'aria-current="step"':action?'':'disabled'} aria-label="Zadanie ${n}, ${state}">${n}${completed?'<span aria-hidden="true">✓</span>':''}</button></li>`;
 }).join('');
 return `<nav class="task-navigator" aria-label="Zadania tej sesji"><p class="task-status">Zadanie ${viewed+1} z ${total} · Ukończone ${done.size} z ${total}</p><ol class="task-numbers">${numbers}</ol></nav>`;
}
