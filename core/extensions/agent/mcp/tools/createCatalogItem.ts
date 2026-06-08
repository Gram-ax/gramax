import { CATEGORY_ROOT_FILENAME } from "@app/config/const";
import Path from "@core/FileProvider/Path/Path";
import type ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import type { Category } from "@core/FileStructue/Category/Category";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import { fail, ok, type ToolExecutionContext, type ToolExecutionResult } from "../tool";
import { buildCatalogItemLookup, normalizePath } from "../utils/catalogPaths";
import { MarkdownDocumentParser } from "../utils/markdownParser";

function normalizeItemName(name: string): string {
	const n = name.trim();
	if (!n) throw new Error("name must not be empty");
	if (/[/\\]/.test(n)) throw new Error("name must not contain / or \\");
	return n;
}

function resolveItemPath(
	catalog: ContextualCatalog,
	parentItemPath: string | undefined,
	normalizedName: string,
	type: "article" | "category",
): { parentCategory: Category; targetItemPath: string } {
	let parentCategory: Category;
	if (!parentItemPath) {
		parentCategory = catalog.getRootCategory();
	} else {
		const rel = normalizePath(parentItemPath);
		const lookup = buildCatalogItemLookup(catalog.name, rel);
		const item = catalog.findItemByItemPath(lookup.fullPath);
		if (!item) throw new Error(`Parent category not found: ${rel}`);
		if (item.type !== ItemType.category) throw new Error(`Parent is not a category (type=${item.type}): ${rel}`);
		parentCategory = item as Category;
	}

	const candidatePath =
		type === "category"
			? parentCategory.folderPath.join(new Path([normalizedName, CATEGORY_ROOT_FILENAME]))
			: parentCategory.folderPath.join(new Path(`${normalizedName}.md`));
	const relToCatalog = catalog.getRepositoryRelativePath(candidatePath);
	if (!relToCatalog) {
		throw new Error("createCatalogItem: cannot resolve child path relative to catalog");
	}
	return { parentCategory, targetItemPath: normalizePath(relToCatalog.value) };
}

type CreateCatalogItemInput = {
	catalogName: string;
	type: "article" | "category";
	name: string;
	parentItemPath?: string;
	content?: string;
};

export async function runCreateCatalogItem({ app, ctx, input }: ToolExecutionContext): Promise<ToolExecutionResult> {
	const { catalogName, type, name, parentItemPath, content } = input as CreateCatalogItemInput;
	try {
		const normalizedName = normalizeItemName(name);
		const catalog = await app.wm.current().getCatalog(normalizePath(catalogName), ctx);
		const rc = app.resourceUpdaterFactory;
		const { parentCategory, targetItemPath } = resolveItemPath(catalog, parentItemPath, normalizedName, type);
		const existingLookup = buildCatalogItemLookup(normalizePath(catalog.name), targetItemPath);
		const existing = catalog.findItemByItemPath(existingLookup.fullPath);
		if (existing) {
			return fail(`Create error (${type}): item already exists: ${normalizePath(targetItemPath)}`);
		}
		const { title: titleFromLine } = MarkdownDocumentParser.splitForAgentStorage(content ?? "");
		if (type === "category") {
			const category = await catalog.createCategory(normalizedName, parentCategory.ref);
			const ru = rc.withContext(catalog.ctx)(catalog);
			if (typeof category.updateProps === "function") {
				category.props.title = titleFromLine;
				await category.updateProps({ fileName: normalizedName, ...category.props }, ru, catalog.deref);
			}
			if (content !== undefined) await category.updateContent(content);
			await app.wm.current().refreshCatalog(catalog.name);
			return ok({
				type: "category",
				itemPath: targetItemPath,
				refreshPage: true,
			});
		}
		const article = await catalog.createArticle(rc, "", parentCategory.ref, false);
		const ru = rc.withContext(catalog.ctx)(catalog);
		article.props.title = titleFromLine;
		await article.updateProps({ fileName: normalizedName, ...article.props }, ru, catalog.deref);
		if (content !== undefined) await article.updateContent(content);
		return ok({
			type: "article",
			itemPath: targetItemPath,
			refreshPage: true,
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return fail(`Create error (${type}): ${msg}`);
	}
}
