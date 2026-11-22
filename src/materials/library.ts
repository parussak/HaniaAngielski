import { assembleModule, validateModules } from '../content-validation.ts';
import { checkGrammarTopics, validateGrammarTopics } from './grammar-topics.ts';
import { legacyCourses } from './legacy.ts';
import type { Course, MaterialLibrary } from './model.ts';
import { identifier, object, validateCatalog, validateCourses } from './validation.ts';

export type ReadMaterial = (path: string) => Promise<unknown>;
interface ModuleFiles { folder: string; metadata: Record<string, unknown>; words: unknown; quiz: unknown; exercises: unknown; grammar: unknown; dialogues: unknown; readings: unknown }
interface CourseFolder { folder: string; course: Course }

/** Shared by browser, content checks and test fixtures. No storage or DOM. */
export async function readLibrary(read: ReadMaterial): Promise<MaterialLibrary> {
    const catalog = validateCatalog(await read('katalog.json'));
    // U-11: a course may keep its modules and grammar topics in its own folder (`<kurs>/kurs.json`).
    const folderEntries = await Promise.all((catalog.courseFolders ?? []).map(async folder => ({ folder, raw: await read(`${folder}/kurs.json`) })));
    const legacyFolders = catalog.modules ?? [];
    const moduleFolders = [...legacyFolders, ...folderEntries.flatMap(({ folder, raw }) => courseModuleFolders(folder, raw))];
    const [courseFile, files] = await Promise.all([
        catalog.coursesFile ? read(catalog.coursesFile) : Promise.resolve(undefined),
        Promise.all(moduleFolders.map(async folder => {
            const [metadata, words, quiz, exercises, grammar] = await Promise.all(['modul.json','slownictwo.json','quiz.json','cwiczenia.json','gramatyka.json'].map(file => read(`${folder}/${file}`)));
            if (!object(metadata) || typeof metadata.id !== 'string') throw new Error('Niepoprawny opis modułu.');
            if (metadata.dialoguesFile !== undefined && metadata.dialoguesFile !== 'rozmowki.json') throw new Error('Niepoprawna nazwa pliku rozmówek.');
            const dialogues = metadata.dialoguesFile ? await read(`${folder}/rozmowki.json`) : [];
            // D-68: readings live in their own file, pointed to by modul.json like the dialogues.
            if (metadata.readingsFile !== undefined && metadata.readingsFile !== 'czytanki.json') throw new Error('Niepoprawna nazwa pliku czytanek.');
            const readings = metadata.readingsFile ? await read(`${folder}/czytanki.json`) : [];
            return { folder, metadata, words, quiz, exercises, grammar, dialogues, readings };
        })),
    ]);
    const own = folderEntries.map(({ folder, raw }) => folderCourse(folder, raw, files));
    const legacyFiles = files.slice(0, legacyFolders.length);
    const registered: Course[] = catalog.coursesFile ? validateCourses(courseFile)
        : legacyFiles.length ? validateCourses({ version: 1, courses: legacyCourses(legacyFiles.map(f => f.metadata) as Parameters<typeof legacyCourses>[0]) }) : [];
    const courses = validateCourses({ version: 1, courses: [...registered, ...own.map(o => o.course)] });
    // D-74: a course grammar-topics file is relative to the course folder when the course has one.
    await Promise.all(courses.map(async course => {
        if (!course.grammarTopicsFile) return;
        const folder = own.find(o => o.course.id === course.id)?.folder;
        course.grammarTopics = validateGrammarTopics(await read(folder ? `${folder}/${course.grammarTopicsFile}` : course.grammarTopicsFile));
    }));
    return assembleLibrary(courses, files);
}

/** Module folders listed in `<kurs>/kurs.json`, as paths relative to `content/`. */
function courseModuleFolders(folder: string, raw: unknown): string[] {
    if (!object(raw) || !Array.isArray(raw.modules) || !raw.modules.length || !raw.modules.every(identifier)) throw new Error('Niepoprawny opis kursu w folderze kursu.');
    return raw.modules.map(module => `${folder}/${module}`);
}

/** `moduleIds` come from the `modul.json` files, so `kurs.json` lists only folders. */
function folderCourse(folder: string, raw: unknown, files: ModuleFiles[]): CourseFolder {
    const { modules, ...course } = raw as Record<string, unknown> & { modules: string[] };
    if (course.id !== folder) throw new Error('Identyfikator kursu musi być nazwą jego folderu.');
    const moduleIds = modules.map(module => files.find(f => f.folder === `${folder}/${module}`)!.metadata.id as string);
    return { folder, course: { ...course, moduleIds } as unknown as Course };
}

function assembleLibrary(courses: Course[], files: ModuleFiles[]): MaterialLibrary {
    const ids = new Set(files.map(f => f.metadata.id));
    const ownership = new Map(courses.flatMap(c => c.moduleIds.map(id => [id, c] as const)));
    if (ids.size !== files.length || ids.size !== ownership.size || [...ids].some(id => typeof id !== 'string' || !ownership.has(id)))
        throw new Error('Lista modułów kursów nie odpowiada katalogowi materiałów.');
    const compiled = validateModules(files.map(f => assembleModule(f.metadata, f.words, f.quiz, f.exercises, f.grammar, f.dialogues, ownership.get(f.metadata.id as string), f.readings)));
    const modules = courses.flatMap(c => c.moduleIds.map(id => compiled.find(m => m.id === id)!));
    for (const course of courses) checkGrammarTopics(course, modules);
    return { courses, modules };
}
