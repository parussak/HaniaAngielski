import { type CatCatalog, type CatReaction } from '../cats.ts';
import { e } from '../ui.ts';
export function catView(catalog: CatCatalog | null, reaction: CatReaction, large = false,instanceId='') {
    if (!catalog)
        return '';
    const { cat, frame, mood } = reaction, sheet = catalog.sheets[frame.sheet];
    const labels = { teacher: 'cierpliwy nauczyciel', happy: 'zadowolony kotek', celebrating: 'świętujący kotek', funny: 'zabawna scenka' };
    const clipId = `cat-clip-${cat.id}-${mood}${instanceId?'-'+instanceId.replace(/[^a-z0-9-]/gi,'-'):''}`;
    return `<figure class="cat-mascot ${large ? 'cat-mascot-large' : ''}" data-cat="${cat.id}" data-mood="${mood}"><svg class="cat-artwork" viewBox="${frame.x} ${frame.y} ${frame.width} ${frame.height}" role="img" aria-label="${e(cat.name)} — ${labels[mood]}" preserveAspectRatio="xMidYMid meet"><defs><clipPath id="${clipId}">${frame.clip ? `<polygon points="${frame.clip.map(p => p.join(',')).join(' ')}"/>` : `<rect x="${frame.x}" y="${frame.y}" width="${frame.width}" height="${frame.height}"/>`}</clipPath></defs><image href="${e(new URL(sheet.src, document.baseURI).href)}" width="${sheet.width}" height="${sheet.height}" clip-path="url(#${clipId})"/></svg>${large ? `<figcaption>${e(cat.name)}</figcaption>` : ''}</figure>`;
}
