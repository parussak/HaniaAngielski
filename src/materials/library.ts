import { assembleModule, validateModules } from '../content-validation.ts';
import { legacyCourses } from './legacy.ts';
import type { Course, MaterialLibrary } from './model.ts';
import { object, validateCatalog, validateCourses } from './validation.ts';

export type ReadMaterial = (path: string) => Promise<unknown>;
interface ModuleFiles { metadata: Record<string, unknown>; words: unknown; quiz: unknown; exercises: unknown; grammar: unknown; dialogues: unknown }

/** Shared by browser, content checks and test fixtures. No storage or DOM. */
export async function readLibrary(read: ReadMaterial): Promise<MaterialLibrary> {
    const catalog = validateCatalog(await read('katalog.json'));
    const [courseFile, files] = await Promise.all([
        catalog.coursesFile ? read(catalog.coursesFile) : Promise.resolve(undefined),
        Promise.all(catalog.modules.map(async folder => {
            const [metadata, words, quiz, exercises, grammar] = await Promise.all(['modul.json','slownictwo.json','quiz.json','cwiczenia.json','gramatyka.json'].map(file => read(`${folder}/${file}`)));
            if (!object(metadata) || typeof metadata.id !== 'string') throw new Error('Niepoprawny opis modułu.');
            if (metadata.dialoguesFile !== undefined && metadata.dialoguesFile !== 'rozmowki.json') throw new Error('Niepoprawna nazwa pliku rozmówek.');
            const dialogues = metadata.dialoguesFile ? await read(`${folder}/rozmowki.json`) : [];
            return { metadata, words, quiz, exercises, grammar, dialogues };
        })),
    ]);
    const courses = catalog.coursesFile ? validateCourses(courseFile) : validateCourses({ version: 1, courses: legacyCourses(files.map(f => f.metadata) as Parameters<typeof legacyCourses>[0]) });
    return assembleLibrary(courses, files);
}

function assembleLibrary(courses: Course[], files: ModuleFiles[]): MaterialLibrary {
    const ids = new Set(files.map(f => f.metadata.id));
    const ownership = new Map(courses.flatMap(c => c.moduleIds.map(id => [id, c] as const)));
    if (ids.size !== files.length || ids.size !== ownership.size || [...ids].some(id => typeof id !== 'string' || !ownership.has(id)))
        throw new Error('Lista modułów kursów nie odpowiada katalogowi materiałów.');
    const compiled = validateModules(files.map(f => assembleModule(f.metadata, f.words, f.quiz, f.exercises, f.grammar, f.dialogues, ownership.get(f.metadata.id as string))));
    const modules = courses.flatMap(c => c.moduleIds.map(id => compiled.find(m => m.id === id)!));
    return { courses, modules };
}
