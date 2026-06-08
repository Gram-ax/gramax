import type Application from "@app/types/Application";
import type Context from "@core/Context/Context";
import type { Article } from "@core/FileStructue/Article/Article";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import type { Category } from "@core/FileStructue/Category/Category";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import { getEditorStore } from "@core-ui/stores/EditorStore";
import { convertContentToUiLanguage } from "@ext/localization/locale/translate";
import getArticleWithTitle from "@ext/markdown/elements/article/edit/logic/getArticleWithTitle";
import { fail, ok, type ToolExecutionContext, type ToolExecutionResult } from "../tool";
import { buildCatalogItemLookup } from "../utils/catalogPaths";
import { createParserForRead, MarkdownDocumentParser } from "../utils/markdownParser";

function getCatalogInnerForUpdate(catalog: ContextualCatalog): Catalog {
	const deref = catalog.deref;
	if (!deref) throw new Error("catalog deref missing");
	return deref;
}

type UpdateCatalogItemInput = {
	catalogName: string;
	itemPath: string;
	content: string;
	lineStart?: number;
	lineEnd?: number;
};

export async function runUpdateCatalogItem({
	app,
	ctx,
	input,
	openItemPath,
}: ToolExecutionContext): Promise<ToolExecutionResult> {
	const { catalogName, itemPath, content, lineStart, lineEnd } = input as UpdateCatalogItemInput;
	if ((lineStart === undefined) !== (lineEnd === undefined)) {
		return fail("update_catalog_item: pass lineStart and lineEnd together, or omit both.");
	}
	const lookup = buildCatalogItemLookup(catalogName, itemPath);

	try {
		const catalog = await app.wm.current().getCatalog(lookup.catalogName, ctx);
		const item = catalog.findItemByItemPath<Article | Category>(lookup.fullPath);

		if (!item) {
			return fail(`Item not found. itemPath: ${lookup.itemPath}`);
		}

		if (item.type !== ItemType.article && item.type !== ItemType.category) {
			return fail(
				`Only article and category are supported, current type=${item.type}. itemPath: ${lookup.itemPath}`,
			);
		}

		if (typeof item.updateContent !== "function") {
			return fail(`Item has no updateContent. itemPath: ${lookup.itemPath}`);
		}

		let composedBody = content;
		if (lineStart !== undefined && lineEnd !== undefined) {
			try {
				const props = (item.props ?? {}) as Record<string, unknown>;
				const propsTitle = typeof props.title === "string" ? props.title : undefined;
				composedBody = createParserForRead(item, propsTitle).applyLineRangeEdit(lineStart, lineEnd, content);
			} catch (e) {
				const msg = e instanceof Error ? e.message : String(e);
				return fail(`Update error (${lookup.itemPath}): ${msg}`);
			}
		}

		const { title: titleFromLine, storageBody } = MarkdownDocumentParser.splitForAgentStorage(composedBody);
		const rc = app.resourceUpdaterFactory;
		const ru = rc.withContext(catalog.ctx)(catalog);
		item.props.title = titleFromLine;
		await item.updateProps(item.props, ru, getCatalogInnerForUpdate(catalog));
		await item.updateContent(storageBody);

		if (openItemPath && openItemPath === lookup.fullPath.value) {
			await updateArticleInUI(app, ctx, catalog, item, titleFromLine, storageBody);
		}

		return ok({
			itemPath: lookup.itemPath,
			...(lineStart !== undefined && lineEnd !== undefined ? { lineStart, lineEnd } : {}),
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return fail(`Update error (${lookup.itemPath}): ${msg}`);
	}
}

const updateArticleInUI = async (
	app: Application,
	ctx: Context,
	catalog: ContextualCatalog,
	article: Article,
	title: string | undefined,
	content: string,
) => {
	const { parser, parserContextFactory } = app;
	const context = await parserContextFactory.fromArticle(
		article,
		catalog,
		convertContentToUiLanguage(ctx.contentLanguage || catalog.props.language),
	);
	const newContent = await parser.parse(content, context);
	await article.parsedContent.write(() => newContent);
	await article.events.emit("item-update-content", { item: article });

	const editor = getEditorStore().editor;
	if (!editor) {
		return;
	}

	editor.commands.setContent(getArticleWithTitle(title ?? "", newContent.editTree));
};
