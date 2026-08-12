jest.mock("pdfjs-dist/legacy/build/pdf.mjs", () => ({ GlobalWorkerOptions: {} }));

import { GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import { configurePdfWorker } from "./pdfWorker";

describe("docportal PDF worker", () => {
	it("resolves pdfjs worker from the installed package", () => {
		Object.assign(global, {
			Bun: {
				resolveSync: jest.fn().mockReturnValue("/app/node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"),
			},
		});

		configurePdfWorker();

		expect(Bun.resolveSync).toHaveBeenCalledWith("pdfjs-dist/legacy/build/pdf.worker.mjs", process.cwd());
		expect(GlobalWorkerOptions.workerSrc).toMatch(/^\//);
		expect(GlobalWorkerOptions.workerSrc).toContain("pdfjs-dist/legacy/build/pdf.worker.mjs");
	});
});
