import type {AppAction} from '../app/actions.ts';
import type {ActionPayload} from '../app/action-payloads.ts';
import {act,e} from '../ui.ts';
export function catInvitation<A extends AppAction>(cat:string,title:string,description:string,action:A,label:string,payload:ActionPayload<A>|undefined,tone='warmup',disabled=false){
 return `<section class="cat-invitation cat-invitation-${e(tone)}"><div class="invitation-cat" aria-hidden="true">${cat}</div><div><h2>${e(title)}</h2><p>${e(description)}</p><button class="primary cat-call" ${(act as (action:AppAction,payload?:unknown)=>string)(action,payload)}${disabled?' disabled':''}>${e(label)} <span aria-hidden="true">🐾</span></button></div></section>`;
}
