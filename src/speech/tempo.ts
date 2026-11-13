export type SpeechKind = 'word' | 'dialogue';

// Approved previews: A for vocabulary, B for dialogue lines.
export const defaultTempo: Readonly<Record<SpeechKind, number>> = {word:0.88,dialogue:0.75};
export function speakingRate(slow=false,kind:SpeechKind='word') {
 return Number((defaultTempo[kind]*(slow?0.7:1)).toFixed(3));
}
