import { assembleModule,validateModules } from './content-validation.ts';

async function json(path: string): Promise<any> {
  const response = await fetch(new URL(`content/${path}`, document.baseURI), { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Nie można wczytać materiału: ${path}`);
  return response.json();
}
export async function loadModules() {
  const catalog = await json('katalog.json');
  if (catalog.version !== 1 || !Array.isArray(catalog.modules) || !catalog.modules.length || !catalog.modules.every((path: unknown)=>typeof path==='string' && /^[a-z0-9-]+$/.test(path))) throw new Error('Niepoprawny katalog materiałów.');
  return validateModules(await Promise.all(catalog.modules.map(async (path: string) => {
    const [metadata, words, quiz, exercises, grammar] = await Promise.all(['modul.json','slownictwo.json','quiz.json','cwiczenia.json','gramatyka.json'].map(file=>json(`${path}/${file}`)));
    if(metadata.dialoguesFile!==undefined && metadata.dialoguesFile!=='rozmowki.json')throw new Error('Niepoprawna nazwa pliku rozmówek.');
    const dialogues=metadata.dialoguesFile?await json(`${path}/${metadata.dialoguesFile}`):[];
    return assembleModule(metadata, words, quiz, exercises, grammar, dialogues);
  })));
}
