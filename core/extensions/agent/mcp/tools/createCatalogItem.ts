import { CATEGORY_ROOT_FILENAME } from "@app/config/const";
import Path from "@core/FileProvider/Path/Path";
import type { Article } from "@core/FileStructue/Article/Article";
import type ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import type { Category } from "@core/FileStructue/Category/Category";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import assert from "assert";
import { AgentArticleParser } from "../parser";
import { fail, ok, type ToolExecutionContext, type ToolExecutionResult } from "../tool";
import { CatalogItemLookup } from "../utils/catalogPaths";

function normalizeItemTitle(title: string): string {
	const n = title.trim();
	assert(n, "title must not be empty");
	assert(!/[/\\]/.test(n), "title must not contain / or \\");
	return n;
}

function resolveItemPath(
	catalog: ContextualCatalog,
	parentItemPath: string | undefined,
	normalizedTitle: string,
	type: "article" | "category",
): { parentCategory: Category; targetItemPath: string } {
	let parentCategory: Category;
	if (!parentItemPath) {
		parentCategory = catalog.getRootCategory();
	} else {
		const item = catalog.findItemByItemPath(new Path(Path.join(catalog.name, parentItemPath)));
		assert(item, `Parent category not found: ${parentItemPath}`);
		assert(item.type === ItemType.category, `Parent is not a category (type=${item.type}): ${parentItemPath}`);
		parentCategory = item as Category;
	}

	const candidatePath =
		type === "category"
			? parentCategory.folderPath.join(new Path([normalizedTitle, CATEGORY_ROOT_FILENAME]))
			: parentCategory.folderPath.join(new Path(`${normalizedTitle}.md`));
	const relToCatalog = catalog.getRepositoryRelativePath(candidatePath);
	assert(relToCatalog, "createCatalogItem: cannot resolve child path relative to catalog");
	return {
		parentCategory,
		targetItemPath: relToCatalog.value,
	};
}

type CreateCatalogItemInput = {
	catalogName: string;
	type: "article" | "category";
	title: string;
	parentItemPath?: string;
};

export async function runCreateCatalogItem({
	app,
	ctx,
	commands,
	input,
}: ToolExecutionContext): Promise<ToolExecutionResult> {
	const { catalogName, type, title, parentItemPath } = input as CreateCatalogItemInput;
	try {
		const normalizedTitle = normalizeItemTitle(title);
		const catalog = await app.wm.current().getCatalog(catalogName, ctx);
		const { parentCategory, targetItemPath } = resolveItemPath(catalog, parentItemPath, normalizedTitle, type);
		const existing = catalog.findItemByItemPath(new Path(Path.join(catalog.name, targetItemPath)));
		if (existing) {
			return fail(`Item already exists. itemPath: ${targetItemPath}`);
		}

		const createdItem: Article | Category =
			type === "category"
				? await catalog.createCategory(normalizedTitle, parentCategory.ref)
				: await catalog.createArticle(app.resourceUpdaterFactory, "", parentCategory.ref, false);

		const ru = app.resourceUpdaterFactory.withContext(catalog.ctx)(catalog);
		await createdItem.updateProps(
			{ ...createdItem.props, fileName: normalizedTitle, title: normalizedTitle },
			ru,
			catalog.deref,
		);

		await app.wm.current().refreshCatalog(catalog.name);
		const refreshedCatalog = await app.wm.current().getCatalog(catalogName, ctx);
		const refreshedItem = refreshedCatalog.findItemByItemPath(new Path(Path.join(catalog.name, targetItemPath)));
		if (!refreshedItem) {
			return fail(`Created item not found after refresh. itemPath: ${targetItemPath}`);
		}

		const parser = await AgentArticleParser.open(
			app,
			ctx,
			commands,
			refreshedCatalog,
			refreshedItem as Article | Category,
		);
		const content = await parser.getMarkdownForAgent();

		return ok(
			{
				type,
				...(await CatalogItemLookup.fromCatalogItem(refreshedCatalog, refreshedItem)).asJSON(),
				content,
			},
			true,
		);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return fail(`Failed to create ${type}: ${msg}`);
	}
}
