/** How the last attempt to play something went: a recording, the device's voice, or nothing. D-80. */
export type PlaybackVia='recording'|'device-voice'|'none';
export interface PlaybackRecord{text:string;language:string;via:PlaybackVia;recordingFile?:string;recordingFailed?:true}
