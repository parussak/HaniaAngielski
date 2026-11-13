export const e = (value: unknown) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const icons: Record<string, string> = {
    paw:'<ellipse cx="5" cy="8" rx="2.3" ry="3"/><ellipse cx="10" cy="5" rx="2.2" ry="3"/><ellipse cx="15" cy="5" rx="2.2" ry="3"/><ellipse cx="20" cy="8" rx="2.3" ry="3"/><path d="M6 16c0-3 3-6 6-6s6 3 6 6c0 6-4 3-6 3s-6 3-6-3Z"/>',
    sound: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  map:'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16"/>',
  profile:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  cat: '<path d="M4 11V4l5 3a11 11 0 0 1 6 0l5-3v7c2 9-18 9-16 0Z"/><path d="M8 11h.01M16 11h.01m-5 3 1 1 1-1M2 13l5 1m-5 3 5-1m15-3-5 1m5 3-5-1"/>',
  leaf: '<path d="M19 4C9 3 3 7 5 14c2 6 12 6 14-10Z"/><path d="m6 18 8-9M10 13l-1-4"/>',
  home: '<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>',
  chart: '<path d="M5 20V11m7 9V4m7 16v-6"/>',
  cloud: '<path d="M7 17H6a4 4 0 0 1-1-8 7 7 0 0 1 13-1 5 5 0 0 1 1 9h-2M12 12v9m-3-3 3 3 3-3"/>',
  cards: '<rect x="7" y="4" width="13" height="16" rx="3"/><path d="M4 7v11a4 4 0 0 0 4 4m3-12h5m-5 4h3"/>',
  spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4m-2-2h4"/>',
  book: '<path d="M12 5C8 2 3 4 3 4v15s5-2 9 1c4-3 9-1 9-1V4s-5-2-9 1Zm0 0v15"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  repeat: '<path d="M20 8a8 8 0 0 0-14-3L3 8m0-5v5h5m-4 8a8 8 0 0 0 14 3l3-3m0 5v-5h-5"/>',
};
export const icon = (name: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] ?? icons.spark}</svg>`;
export const button = (action: string, text: string, cls = 'primary') => `<button class="${cls}" data-action="${action}">${text}</button>`;

export const date = (value: string) => new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
