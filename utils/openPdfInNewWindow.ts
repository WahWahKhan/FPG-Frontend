/**
 * Open a PDF data URL in a new window on mobile.
 *
 * Must be called synchronously inside the click handler (Safari's popup
 * blocker kills window.open() otherwise). Navigates the new window straight
 * to a Blob URL so the browser's native PDF viewer fills the viewport
 * (fit-to-width, scrollable). The old approach wrapped the PDF in a 100vw x
 * 100vh <iframe>, and iOS Safari shrinks a tall single-page PDF to fit the
 * iframe's HEIGHT — leaving it tiny and off-centre. Falls back to the iframe
 * wrapper if the blob can't be built.
 */
export function openPdfInNewWindow(pdfDataUrl: string, title = 'PDF'): boolean {
  const win = window.open('', '_blank');
  if (!win) return false;

  try {
    const base64 = pdfDataUrl.split(',')[1] || '';
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const blobUrl = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    win.location.href = blobUrl;
    return true;
  } catch (err) {
    console.error('Blob PDF open failed, falling back to iframe:', err);
    const safeTitle = title.replace(/[<>&"]/g, '');
    win.document.write(
      `<!DOCTYPE html><html><head><title>${safeTitle}</title><style>body{margin:0}iframe{width:100vw;height:100vh;border:none}</style></head><body><iframe src="${pdfDataUrl}"></iframe></body></html>`
    );
    win.document.close();
    return true;
  }
}
