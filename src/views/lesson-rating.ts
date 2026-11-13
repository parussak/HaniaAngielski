import {lessonRating} from '../learning/statistics.ts';
import type {Session} from '../learning/model.ts';
import {icon} from '../ui.ts';

export function lessonRatingView(s:Session){
 const rating=lessonRating(s);if(rating===null)return '<p class="lesson-rating-unavailable">W tej starszej sesji nie zapisano ocenianych odpowiedzi.</p>';
 const label=String(rating).replace('.',',');
 return `<div class="lesson-rating"><div class="rating-paws" role="img" aria-label="Ocena: ${label} z 3 kocich łapek">${[0,1,2].map(i=>`<span class="rating-paw" aria-hidden="true">${icon('paw')}<span style="width:${Math.max(0,Math.min(1,rating-i))*100}%">${icon('paw')}</span></span>`).join('')}</div><p class="rating-value">${label} / 3 łapki</p><p>Łapki za pierwsze odpowiedzi. Poprawki pomagają w nauce.</p>${rating===3?'<p>Bezbłędnie! Koci komplet łapek 🐾</p>':''}</div>`;
}
