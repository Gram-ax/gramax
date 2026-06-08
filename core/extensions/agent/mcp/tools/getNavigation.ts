import type { Category } from "@core/FileStructue/Category/Category";
import type { Item } from "@core/FileStructue/Item/Item";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import { fail, ok, type ToolExecutionContext, type ToolExecutionResult } from "../tool";
import { buildCatalogItemLookup, normalizePath } from "../utils/catalogPaths";

type NavigationNode = {
	type: string;
	title: string;
	itemPath: string;
	children?: NavigationNode[];
};

function serializeChild(item: Item) {
	const itemPath = item.ref.path.value;
	const title = item.getTitle() ?? "";
	return {
		type: item.type,
		title,
		itemPath,
	};
}

function serializeTree(item: Item): NavigationNode {
	const base = serializeChild(item);
	if (item.type !== ItemType.category) return base;
	const category = item as Category;
	return { ...base, children: (category.items ?? []).map((it) => serializeTree(it)) };
}

type GetNavigationInput = {
	catalogName: string;
	itemPath?: string;
};

export async function runGetNavigation({ app, ctx, input }: ToolExecutionContext): Promise<ToolExecutionResult> {
	const { catalogName, itemPath } = input as GetNavigationInput;
	const catName = normalizePath(catalogName);
	const startPathRaw = itemPath?.trim() ?? "";
	try {
		const catalog = await app.wm.current().getCatalog(catName, ctx);
		let startNode: Item;
		if (!startPathRaw) {
			startNode = catalog.getRootCategory();
		} else {
			const lookup = buildCatalogItemLookup(catName, startPathRaw);
			const item = catalog.findItemByItemPath(lookup.fullPath);
			if (!item) return fail(`Start node not found. itemPath: ${lookup.itemPath}`);
			startNode = item;
		}
		const tree = serializeTree(startNode);
		return ok({
			root: { type: tree.type, title: tree.title, itemPath: tree.itemPath },
			tree,
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return fail(`Navigation build error (${catName}): ${msg}`);
	}
}
