import type {AppAction} from '../app/actions.ts';
import {act,e} from '../ui.ts';
export function catInvitation(cat:string,title:string,description:string,action:AppAction,label:string,attributes='',tone='warmup'){
 return `<section class="cat-invitation cat-invitation-${e(tone)}"><div class="invitation-cat" aria-hidden="true">${cat}</div><div><h2>${e(title)}</h2><p>${e(description)}</p><button class="primary cat-call" ${act(action)} ${attributes}>${e(label)} <span aria-hidden="true">🐾</span></button></div></section>`;
}
