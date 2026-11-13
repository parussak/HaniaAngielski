import {e,icon} from '../ui.ts';

/** Every playback entry point offers the same text at normal and slower speed. */
export function speechButtons(text:string,language:string,options:{playLabel:string;playClass?:string;slowClass?:string;playAria?:string;slowAria?:string}) {
 const data=`data-action="listen" data-say="${e(text)}" data-lang="${e(language)}"`;
 return `<button class="${e(options.playClass??'secondary')}" ${data}${options.playAria?` aria-label="${e(options.playAria)}"`:''}>${icon('sound')} ${e(options.playLabel)}</button><button class="${e(options.slowClass??'secondary')}" ${data} data-slow="true"${options.slowAria?` aria-label="${e(options.slowAria)}"`:''}>Wolniej</button>`;
}
