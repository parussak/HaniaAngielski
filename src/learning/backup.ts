import {type Backup,type Progress} from './model.ts';
import {obj,date} from './backup-validation/values.ts';
import {validProgress,validActiveReview} from './backup-validation/progress.ts';
import {validArchives} from './backup-validation/archives.ts';

/** Version-1 entry point: validation never normalizes or migrates saved data. */
export function validateBackup(input:unknown):Backup {
    const fail=():never=>{throw new Error('Plik nie jest poprawną lub obsługiwaną kopią postępów. Obecne dane pozostają bez zmian.');};
    if (!obj(input) || input.app !== 'hania-language' || input.version !== 1 || !date(input.exportedAt) || !obj(input.progress))
        return fail();
    const p=input.progress;
    if(!validProgress(p))return fail();
    if(input.archives!==undefined&&!validArchives(input.archives,p.sessions.map(s=>s.id),p.active))return fail();
    if(!validActiveReview(p))return fail();
    return structuredClone(input) as unknown as Backup;
}
export function backup(p: Progress): Backup { return { app: 'hania-language', version: 1, exportedAt: new Date().toISOString(), progress: structuredClone(p) }; }
