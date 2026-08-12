import { GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";

export function configurePdfWorker(): void {
	GlobalWorkerOptions.workerSrc = Bun.resolveSync("pdfjs-dist/legacy/build/pdf.worker.mjs", process.cwd());
}
