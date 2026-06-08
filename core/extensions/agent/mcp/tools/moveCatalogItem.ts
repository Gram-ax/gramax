import type { ItemRef } from "@core/FileStructue/Item/ItemRef";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import { fail, ok, type ToolExecutionContext, type ToolExecutionResult } from "../tool";
import { buildCatalogItemLookup } from "../utils/catalogPaths";

type MoveCatalogItemInput = {
	catalogName: string;
	fromItemPath: string;
	toItemPath: string;
};

function validateTargetPathForType(type: ItemType, targetItemPath: string): string | null {
	if (type === ItemType.category) {
		if (!targetItemPath.endsWith("_index.md")) {
			return "move_catalog_item: for category target toItemPath must end with _index.md";
		}
		return null;
	}
	if (!targetItemPath.endsWith(".md")) {
		return "move_catalog_item: for article target toItemPath must end with .md";
	}
	if (targetItemPath.endsWith("_index.md")) {
		return "move_catalog_item: article cannot be moved to category path (_index.md)";
	}
	return null;
}

export async function runMoveCatalogItem({ app, ctx, input }: ToolExecutionContext): Promise<ToolExecutionResult> {
	const { catalogName, fromItemPath, toItemPath } = input as MoveCatalogItemInput;

	const fromLookup = buildCatalogItemLookup(catalogName, fromItemPath);
	const toLookup = buildCatalogItemLookup(catalogName, toItemPath);
	if (fromLookup.fullPath.compare(toLookup.fullPath)) {
		return fail("move_catalog_item: fromItemPath and toItemPath must be different");
	}

	try {
		const catalog = await app.wm.current().getCatalog(fromLookup.catalogName, ctx);
		const sourceItem = catalog.findItemByItemPath(fromLookup.fullPath);
		if (!sourceItem) {
			return fail(`Item not found. itemPath: ${fromLookup.itemPath}`);
		}
		if (sourceItem.ref === undefined || sourceItem.ref === null) {
			return fail(`Item has no ref. itemPath: ${fromLookup.itemPath}`);
		}

		const pathValidationError = validateTargetPathForType(sourceItem.type, toLookup.itemPath);
		if (pathValidationError) return fail(pathValidationError);

		const existing = catalog.findItemByItemPath(toLookup.fullPath);
		if (existing) {
			return fail(`Move error: target already exists: ${toLookup.itemPath}`);
		}

		if (sourceItem.type === ItemType.category) {
			const sourceDir = sourceItem.ref.path.parentDirectoryPath;
			const targetDir = toLookup.fullPath.parentDirectoryPath;
			if (targetDir.startsWith(sourceDir)) {
				return fail("Move error: cannot move category inside itself");
			}
		}

		const toRef: ItemRef = {
			path: toLookup.fullPath,
			storageId: sourceItem.ref.storageId,
		};
		const baseCatalog = catalog.deref;
		if (!baseCatalog) {
			return fail("Move error: catalog deref missing");
		}
		const moved = await baseCatalog.moveItem(sourceItem.ref, toRef, app.resourceUpdaterFactory.withContext(ctx), [
			sourceItem.ref,
		]);

		return ok({
			type: moved.type,
			fromItemPath: fromLookup.itemPath,
			toItemPath: toLookup.itemPath,
			refreshPage: true,
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return fail(`Move error (${fromLookup.itemPath} -> ${toLookup.itemPath}): ${msg}`);
	}
}
