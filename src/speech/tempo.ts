export type SpeechKind = 'word' | 'dialogue';

// Trial tempos for the next listening check on the learner's phone (D-65).
export const defaultTempo: Readonly<Record<SpeechKind, number>> = {word:0.95,dialogue:0.9};
export function speakingRate(slow=false,kind:SpeechKind='word') {
 return Number((defaultTempo[kind]*(slow?0.7:1)).toFixed(3));
}
