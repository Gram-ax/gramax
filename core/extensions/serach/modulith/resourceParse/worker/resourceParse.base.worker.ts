import SearchArticleContentParserHTML from "@ext/serach/modulith/parsing/SearchArticleContentParserHTML";
import type {
	ResourceParseParseResourceInMessage,
	ResourceParseWorkerInMessage,
	ResourceParseWorkerOutMessage,
} from "@ext/serach/modulith/resourceParse/worker/types";
import { createSimpleError } from "@ext/serach/modulith/utils/SimpleError";
import type { ArticleItem } from "@ics/gx-vector-search";
import { pdfToArticleItems } from "@ics/modulith-pdf-parse";
import { AggregateProgress } from "@ics/modulith-utils";
import { DOMParser } from "@xmldom/xmldom";
import mammoth from "mammoth";
import { PDFWorker } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { TypedArray } from "pdfjs-dist/types/src/display/api";

export interface HandlerContext {
	isNode: boolean;
	postMessage: (message: ResourceParseWorkerOutMessage) => void;
}

// Prevent PDF.js from creating a worker, because we already in worker
PDFWorker["__#60@#isWorkerDisabled"] = true;

const domParser = new DOMParser();

export async function handleMessage(msg: ResourceParseWorkerInMessage, ctx: HandlerContext): Promise<void> {
	try {
		const type = msg.type;
		switch (type) {
			case "parseResource":
				return await handleParseResource(msg, ctx);
			default:
				console.error(`Unexpected message type: ${type}`, msg);
		}
	} catch (err) {
		const error = err instanceof Error ? err : new Error(err);
		ctx.postMessage({ type: "error", requestId: msg.requestId, error: createSimpleError(error) });
	}
}

async function handleParseResource(
	{ requestId, format, data }: ResourceParseParseResourceInMessage,
	ctx: HandlerContext,
): Promise<void> {
	const { postMessage } = ctx;
	const progress = (p: number) => postMessage({ type: "progress", requestId, progress: p });
	if (format === "docx") {
		const html = (
			await mammoth.convertToHtml(ctx.isNode ? { buffer: data } : { arrayBuffer: data.buffer as ArrayBuffer })
		).value;
		progress(0.5);
		const items = await parseHtmlToArticleItems(html);
		progress(1);
		postMessage({ type: "result", requestId, items });
		return;
	}
	if (format === "pdf") {
		const aggProgress = new AggregateProgress({
			progress: {
				weights: [95, 5],
			},
			onChange: (p) => progress(p),
		});

		const items = await pdfToArticleItems(data as unknown as TypedArray, aggProgress.getProgressCallback(0));
		aggProgress.setProgress(1, 1);
		postMessage({ type: "result", requestId, items });
		return;
	}

	postMessage({ type: "error", requestId, error: createSimpleError(new Error(`Unknown format: ${format}`)) });
}

async function parseHtmlToArticleItems(html: string): Promise<ArticleItem[]> {
	const root = parseXml(html);
	if (!root?.childNodes) return [];
	return await new SearchArticleContentParserHTML(root.childNodes).parse();
}

function parseXml(xml: string): Node | undefined {
	return domParser.parseFromString(`<root>${xml}</root>`, "text/xml")?.firstChild as unknown as Node;
}
