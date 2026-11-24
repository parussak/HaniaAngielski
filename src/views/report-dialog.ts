import {categoriesFor,outcomeText,reportLabels,type ReportDraft} from '../learning/problem-report.ts';
import {act,e,icon} from '../ui.ts';

const close=(text='Zamknij')=>`<button class="secondary report-close" ${act('report-close')}>${e(text)}</button>`;

const reportOpenButton=`<button class="report-open" ${act('report-open')}>Zgłoś problem</button>`;
const cardEnd='</section><p class="under-card">';
/**
 * The quiet way into a report: last thing inside the task's card, always there, also when sound has failed.
 * Inside the card (which scrolls on a phone) it takes no room from the task; the task's own markup is otherwise untouched.
 */
export function withReportButton(studyHtml:string):string{
 const at=studyHtml.lastIndexOf(cardEnd);
 return at<0?studyHtml+reportOpenButton:studyHtml.slice(0,at)+reportOpenButton+studyHtml.slice(at);
}

/** The inside of the report window. The text of a task never reaches here except through `e()`. */
export function reportDialogView(draft:ReportDraft):string{
 const problem=draft.problem?`<p class="report-problem" role="alert">${e(draft.problem)}</p>`:'';
 switch(draft.step){
  case 'category':
   return `<h2 id="report-title" tabindex="-1">Co jest nie tak?</h2>${problem}<div class="report-choices">${categoriesFor(draft.utterances.length>0).map(category=>`<button class="option report-choice" ${act('report-category',{category})}>${e(reportLabels[category])}</button>`).join('')}</div>${close()}`;
  case 'which':
   return `<h2 id="report-title" tabindex="-1">Której wypowiedzi to dotyczy?</h2><div class="report-choices">${draft.utterances.map((u,index)=>`<button class="option report-choice" ${act('report-utterance',{index})}><span><strong>${e(u.label)}</strong>${index===draft.lastIndex?' · ostatnio odtwarzana':''}<br><small lang="${e(u.language)}">${e(u.text)}</small></span></button>`).join('')}</div>${close()}`;
  case 'comment':
   return `<h2 id="report-title" tabindex="-1">Coś innego</h2>${problem}<form id="report-form" class="report-form"><label for="report-comment">Napisz krótko, co się stało</label><textarea id="report-comment" name="comment" rows="4" maxlength="500" required></textarea><div class="actions"><button class="primary" type="submit">Wyślij ${icon('arrow')}</button>${close()}</div></form>`;
  case 'sending':
   return `<h2 id="report-title" tabindex="-1">Wysyłam…</h2><p role="status">Chwileczkę, zapisuję zgłoszenie.</p>${close()}`;
  case 'done':
   return `<h2 id="report-title" tabindex="-1">${draft.outcome==='sent'?'Dziękujemy!':'Zgłoszenie zapisane'}</h2><p role="status">${e(outcomeText[draft.outcome??'waiting-error'])}</p><button class="primary report-back" ${act('report-close')}>Wróć do zadania</button>`;
 }
}
