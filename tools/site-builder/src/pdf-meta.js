export async function readPdfMeta(filePath) {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const data = new Uint8Array(await (await import("node:fs/promises")).readFile(filePath));
    const loadingTask = pdfjs.getDocument({ data, disableWorker: true, isEvalSupported: false });
    const doc = await loadingTask.promise;
    const info = (await doc.getMetadata()).info || {};
    let heading = "";
    try {
      const page = await doc.getPage(1);
      const text = await page.getTextContent();
      heading = text.items.map((it) => it.str).join(" ").trim().split(/\s+/).slice(0, 16).join(" ");
    } catch {
      heading = "";
    }
    doc.destroy();
    return { Title: info.Title, Subject: info.Subject, CreationDate: info.CreationDate, ModDate: info.ModDate, heading };
  } catch {
    return { corrupt: true };
  }
}
