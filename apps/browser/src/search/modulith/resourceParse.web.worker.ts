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

// In Node.js pdfjs-dist uses relative ./pdf.worker.mjs
// In browser we need to do this so Vite builds worker and client can request it
GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();

const ctx = self as unknown as Worker;

const handlerContext: HandlerContext = {
	isNode: false,
	postMessage: (message: ResourceParseWorkerOutMessage) => {
		ctx.postMessage(message);
	},
};

ctx.addEventListener("message", (event: MessageEvent<ResourceParseWorkerInMessage>) => {
	void handleMessage(event.data, handlerContext);
});
