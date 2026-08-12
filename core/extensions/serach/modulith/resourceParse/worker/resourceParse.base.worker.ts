import type { ResourceReadTarget } from "@core/FileProvider/ResourceReadSource";
import { XxHash } from "@core/Hash/Hasher";
import SearchArticleContentParserHTML from "@ext/serach/modulith/parsing/SearchArticleContentParserHTML";
import type {
	ResourceParseParseResourceFileInMessage,
	ResourceParseParseResourceInMessage,
	ResourceParseWorkerInMessage,
	ResourceParseWorkerOutMessage,
} from "@ext/serach/modulith/resourceParse/worker/types";
import { createSimpleError } from "@ext/serach/modulith/utils/SimpleError";
import type { ArticleId, ArticleItems } from "@ics/article-search/article";
import { pdfToArticleItems } from "@ics/article-search-pdf-parse";
import { AggregateProgress } from "@ics/article-search-utils";
import { DOMParser } from "@xmldom/xmldom";
import assert from "assert";
import type { Buffer } from "buffer";
import mammoth from "mammoth";
import type { TypedArray } from "pdfjs-dist/types/src/display/api";

export interface HandlerContext {
	isNode: boolean;
	postMessage: (message: ResourceParseWorkerOutMessage) => void;
	readFile?: (source: ResourceReadTarget) => Promise<Buffer | undefined>;
}

const domParser = new DOMParser();
let hashInit: Promise<void> | undefined;

export async function handleMessage(msg: ResourceParseWorkerInMessage, ctx: HandlerContext): Promise<void> {
	try {
		if (!hashInit) hashInit = XxHash.init();
		await hashInit;
		const type = msg.type;
		switch (type) {
			case "parseResource":
				return await handleParseResource(msg, ctx);
			case "parseResourceFile":
				return await handleParseResourceFile(msg, ctx);
			default:
				console.error(`Unexpected message type: ${type}`, msg);
		}
	} catch (err) {
		const error = err instanceof Error ? err : new Error(err);
		ctx.postMessage({ type: "error", requestId: msg.requestId, error: createSimpleError(error) });
	}
}

async function handleParseResourceFile(
	{ requestId, source, articleId, title, format, knownHash }: ResourceParseParseResourceFileInMessage,
	ctx: HandlerContext,
): Promise<void> {
	assert(ctx.readFile, "Resource file reading is not supported in this worker");

	let data: Buffer | undefined;
	for (const target of source.targets) {
		data = await ctx.readFile(target);
		if (data) break;
	}
	if (!data) {
		ctx.postMessage({ type: "result", requestId, items: undefined });
		return;
	}

	const hash = XxHash.single(data);
	if (Number(knownHash) === hash) {
		ctx.postMessage({ type: "result", requestId, hash: String(hash), items: undefined });
		return;
	}

	await handleParseResource({ type: "parseResource", requestId, format, data, articleId, title }, ctx, String(hash));
}

async function handleParseResource(
	{ requestId, format, data, articleId, title }: ResourceParseParseResourceInMessage,
	ctx: HandlerContext,
	hash?: string,
): Promise<void> {
	const { postMessage } = ctx;
	const progress = (p: number) => postMessage({ type: "progress", requestId, progress: p });
	if (format === "docx") {
		const html = (
			await mammoth.convertToHtml(ctx.isNode ? { buffer: data } : { arrayBuffer: data.buffer as ArrayBuffer })
		).value;
		progress(0.5);
		const items = await parseHtmlToArticleItems(articleId, title, html);
		progress(1);
		postMessage({ type: "result", requestId, items, hash });
		return;
	}
	if (format === "pdf") {
		const aggProgress = new AggregateProgress({
			progress: {
				weights: [95, 5],
			},
			onChange: (p) => progress(p),
		});

		const pdfData = new Uint8Array(data);
		const items = await pdfToArticleItems(
			articleId,
			title,
			pdfData as unknown as TypedArray,
			aggProgress.getProgressCallback(0),
		);
		aggProgress.setProgress(1, 1);
		postMessage({ type: "result", requestId, items, hash });
		return;
	}

	postMessage({ type: "error", requestId, error: createSimpleError(new Error(`Unknown format: ${format}`)) });
}

async function parseHtmlToArticleItems(
	articleId: ArticleId,
	title: string,
	html: string,
): Promise<ArticleItems<never> | undefined> {
	const root = parseXml(html);
	if (!root?.childNodes) return;
	return await new SearchArticleContentParserHTML(articleId, title, root.childNodes).parse();
}

function parseXml(xml: string): Node | undefined {
	return domParser.parseFromString(`<root>${xml}</root>`, "text/xml")?.firstChild as unknown as Node;
}
