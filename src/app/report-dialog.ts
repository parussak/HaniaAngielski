import {AppState} from './state.ts';
import {readCall,isCallOwnedBy} from './action-payloads.ts';
import {readReportSubmit} from './form-payloads.ts';
import type {createReportController} from '../controllers/report.ts';
import {reportDialogView} from '../views/report-dialog.ts';

/**
 * D-80: the report window is a native modal dialog outside `#app`. The task underneath is never
 * redrawn, so a typed answer, focus and the lesson stay exactly as they were. Returns the redraw.
 */
export function bindReportDialog(dialog:HTMLDialogElement,state:AppState,report:ReturnType<typeof createReportController>){
 dialog.className='report-dialog';dialog.setAttribute('aria-labelledby','report-title');
 function draw(){
  const draft=state.report;
  if(!draft){if(dialog.open)dialog.close();dialog.replaceChildren();return;}
  const step=dialog.dataset.step;dialog.dataset.step=draft.step;
  dialog.innerHTML=reportDialogView(draft);
  if(!dialog.open)dialog.showModal();
  if(step!==draft.step)(dialog.querySelector<HTMLElement>('#report-comment')??dialog.querySelector<HTMLElement>('#report-title'))?.focus();
 }
 dialog.addEventListener('click',ev=>{
  const el=(ev.target as HTMLElement).closest<HTMLElement>('[data-action]');if(!el)return;
  ev.preventDefault();
  const call=readCall(el.dataset.action!,el);
  if(call&&isCallOwnedBy('report',call))void report.handleAction(...call);
 });
 dialog.addEventListener('submit',ev=>{
  const form=readReportSubmit(ev);if(!form)return;
  ev.preventDefault();void report.submitComment(form.comment);
 });
 // Esc and the system "back" close the report, never the lesson underneath.
 dialog.addEventListener('cancel',ev=>{ev.preventDefault();void report.handleAction('report-close');});
 return draw;
}
