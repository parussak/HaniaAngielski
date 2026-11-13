/** Shared by the offline generator and player; no dependency on the browser or Node. */
export const normalizeSpeechText=(text:string)=>text.normalize('NFC').replace(/\s+/gu,' ').trim();
export const speechKey=(text:string,language:string)=>JSON.stringify([language.toLowerCase().replace(/_/g,'-'),normalizeSpeechText(text)]);
