// D-81: wpisany, jeszcze niewysłany tekst żyje tylko w polu na ekranie. Przerysowanie na podgląd by go skasowało,
// więc trzymamy go do powrotu na to samo zadanie. Niczego nie zapisuje.
import type {AppState} from './state.ts';

export function createAnswerDraft(root:HTMLElement,state:AppState){
 let held:{task:string;value:string}|undefined;
 const input=()=>root.querySelector<HTMLInputElement>('#answer');
 const task=()=>{const s=state.progress.active;return `${state.user?.uid??'guest'}:${s?.id}:${s?.index}:${s?.phase}`;};
 return {
  /** Przed przerysowaniem: na ekranie jest jeszcze poprzedni widok. */
  keep(){const field=input();if(state.taskPreview&&field)held={task:task(),value:field.value};},
  /** Po przerysowaniu: oddaje tekst, gdy podgląd zamknięto. */
  restore(){
   if(!held||state.taskPreview)return;
   const field=input();if(field&&held.task===task())field.value=held.value;
   held=undefined;
  },
 };
}
