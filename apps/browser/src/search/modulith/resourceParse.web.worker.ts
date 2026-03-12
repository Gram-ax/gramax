import {
	type HandlerContext,
	handleMessage,
} from "@ext/serach/modulith/resourceParse/worker/resourceParse.base.worker";
import type {
	ResourceParseWorkerInMessage,
	ResourceParseWorkerOutMessage,
} from "@ext/serach/modulith/resourceParse/worker/types";
// @ics/modulith-pdf-parse uses legacy build for compatibility with Node.js
import { GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";

const ctx = self as unknown as Worker;

const handlerContext: HandlerContext = {
	isNode: false,
	initPdfJs: async () => {
		GlobalWorkerOptions.workerPort = new Worker(new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url), {
			type: "module",
		});
	},
	postMessage: (message: ResourceParseWorkerOutMessage) => {
		ctx.postMessage(message);
	},
};

ctx.addEventListener("message", (event: MessageEvent<ResourceParseWorkerInMessage>) => {
	void handleMessage(event.data, handlerContext);
});
