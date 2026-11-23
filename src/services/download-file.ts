/** Pobranie pliku JSON w przeglądarce (powłoka DOM; kontroler dostaje ją jako port `saveFile`). */
export function downloadJsonFile(filename: string, json: string) {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
