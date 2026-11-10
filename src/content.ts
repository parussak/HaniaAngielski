import { readLibrary } from './materials/library.ts';

export const loadLibrary = () => readLibrary(async path => {
    const response = await fetch(new URL('content/' + path, document.baseURI), { cache: 'no-cache' });
    if (!response.ok) throw new Error('Nie można wczytać materiału: ' + path);
    return response.json();
});

// Compatibility for integrations that only need the flat module projection.
export async function loadModules() { return (await loadLibrary()).modules; }
