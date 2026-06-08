import { findCommand } from "@app/commands";
import type Context from "@core/Context/Context";
import type { Article } from "@core/FileStructue/Article/Article";
import type { Category } from "@core/FileStructue/Category/Category";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import { fail, ok, type ToolExecutionContext, type ToolExecutionResult } from "../tool";
import { buildCatalogItemLookup } from "../utils/catalogPaths";
import { createParserForRead, MarkdownDocumentParser } from "../utils/markdownParser";

type ReadCatalogItemInput = {
	catalogName: string;
	itemPath: string;
	lineStart?: number;
	lineEnd?: number;
};

function createLinkedFileReader(options: {
	ctx: Context;
	cmd: ReturnType<typeof findCommand>;
	articlePath: string;
	catalogName: string;
}): (pathFromTag: string) => Promise<string> {
	const { ctx, cmd, articlePath, catalogName } = options;
	return async (pathFromTag: string) => {
		const q = {
			src: pathFromTag,
			articlePath,
			catalogName,
			mimeType: MimeTypes.text,
		};
		const args = cmd.params(ctx, q, undefined);
		const res = (await cmd.do(args)) as { hashItem?: { getContent: () => Promise<string> } } | undefined;
		if (!res?.hashItem) {
			throw new Error("Resource not found");
		}
		return (await res.hashItem.getContent()) ?? "";
	};
}

export async function runReadCatalogItem({
	app,
	ctx,
	commands,
	input,
}: ToolExecutionContext): Promise<ToolExecutionResult> {
	const { catalogName, itemPath, lineStart, lineEnd } = input as ReadCatalogItemInput;
	if (
		(lineStart !== undefined && (!Number.isInteger(lineStart) || lineStart < 1)) ||
		(lineEnd !== undefined && (!Number.isInteger(lineEnd) || lineEnd < 0)) ||
		(lineStart === undefined) !== (lineEnd === undefined) ||
		(lineStart !== undefined && lineEnd !== undefined && lineStart > lineEnd)
	) {
		return fail("read_catalog_item: pass lineStart and lineEnd together; lineStart must be ≤ lineEnd.");
	}
	const lookup = buildCatalogItemLookup(catalogName, itemPath);
	try {
		const catalog = await app.wm.current().getCatalog(lookup.catalogName, ctx);
		const item = catalog.findItemByItemPath<Article | Category>(lookup.fullPath);
		if (!item) return fail(`Node not found. itemPath: ${lookup.itemPath}`);
		if (item.type !== ItemType.article && item.type !== ItemType.category) {
			return fail(
				`Only article and category are supported, current type=${item.type}. itemPath: ${lookup.itemPath}`,
			);
		}
		let markdownForReadSource = item.content ?? "";
		if (lineStart === undefined && lineEnd === undefined) {
			const doc = MarkdownDocumentParser.fromRawMarkdown(markdownForReadSource);
			const articleDir = item.ref.path.parentDirectoryPath;
			const cmd = findCommand(commands, "article/resource/get");
			const readLinkedFile = createLinkedFileReader({
				ctx,
				cmd,
				articlePath: item.ref.path.value,
				catalogName: lookup.catalogName,
			});
			markdownForReadSource = (await doc.expandMermaidPathTags(articleDir, readLinkedFile)).getRawMarkdown();
		}
		const props = (item.props ?? {}) as Record<string, unknown>;
		const propsTitle = typeof props.title === "string" ? props.title : undefined;
		const parser = createParserForRead(item, propsTitle, markdownForReadSource);
		const totalLines = parser.getNumberedLines().length;
		let lines: ReturnType<typeof parser.getNumberedLines>;
		if (lineStart !== undefined && lineEnd !== undefined) {
			if (lineStart < 1 || lineEnd > totalLines) {
				return fail(
					`read_catalog_item: range ${lineStart}–${lineEnd} is outside the file (${totalLines} lines). itemPath: ${lookup.itemPath}`,
				);
			}
			lines = parser.getNumberedLinesInRange(lineStart, lineEnd);
		} else {
			lines = parser.getNumberedLines();
		}
		const linesTuples = lines.map((row) => [row.line, row.text] as [number, string]);
		return ok({
			itemPath: lookup.itemPath,
			lines: linesTuples,
			...(lineStart !== undefined && lineEnd !== undefined ? { lineStart, lineEnd } : {}),
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return fail(`Read error (${lookup.itemPath}): ${msg}`);
	}
}
