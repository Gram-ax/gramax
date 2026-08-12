import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import type { ItemRef } from "@core/FileStructue/Item/ItemRef";
import type { MakeResourceUpdater } from "@core/Resource/ResourceUpdaterFactory";
import type { NodeModel } from "@minoru/react-dnd-treeview";
import type { Catalog } from "../../../../../logic/FileStructue/Catalog/Catalog";
import type { ItemLink } from "../../../NavigationLinks";
import DragTree from "./DragTree";
import DragTreeTransformer from "./DragTreeTransformer";

// #192 — Incorrect Language of transferred articles.
// When viewing a secondary language, the navigation tree is rooted on the
// language category (catalog/<lang>), but DragTree resolves the synthetic ROOT
// node (id === 0) to catalog.getRootCategoryRef() — the TRUE catalog root.
// Dragging an article to the top level then loses the /<lang>/ path segment,
// so the moved article ends up on the primary language and at the end of nav.
describe("DragTree synthetic ROOT ref resolution", () => {
	const trueRootRef: ItemRef = { path: new Path("catalog/_index.md"), storageId: "s" };
	const langRootRef: ItemRef = { path: new Path("catalog/en/_index.md"), storageId: "s" };
	const catalog = { getRootCategoryRef: () => trueRootRef } as unknown as Catalog;
	const rootNode = DragTreeTransformer.getRootItem(); // id === 0 → synthetic ROOT

	const fp = {} as unknown as FileProvider;
	const resourceUpdater = {} as unknown as MakeResourceUpdater;

	const rootRefOf = (dragTree: DragTree): ItemRef => {
		const getItemRef = (
			dragTree as unknown as Record<string, (item: NodeModel<ItemLink>, catalog: Catalog) => ItemRef>
		)["_getItemRef"];
		return getItemRef(rootNode, catalog);
	};

	test("falls back to the catalog root when no language root is provided", () => {
		const dragTree = new DragTree(fp, resourceUpdater);
		expect(rootRefOf(dragTree).path.value).toBe(trueRootRef.path.value);
	});

	test("resolves the synthetic ROOT to the language category for a secondary language", () => {
		const dragTree = new DragTree(fp, resourceUpdater, langRootRef);
		expect(rootRefOf(dragTree).path.value).toBe(langRootRef.path.value);
	});
});

describe("DragTree ordering ancestors", () => {
	test("resolves the target parent when moving an article between categories", async () => {
		const ref = (path: string) => ({ path: new Path(path), storageId: "s" });
		const firstCategory = { ref: ref("catalog/first/_index.md") };
		const secondCategory = { ref: ref("catalog/second/_index.md") };
		const existingArticle = { ref: ref("catalog/second/existing.md") };
		const draggedArticle = { ref: ref("catalog/first/article.md") };
		const node = (item: { ref: ItemRef }, parent: string | number): NodeModel<ItemLink> => ({
			id: item.ref.path.value,
			parent,
			text: item.ref.path.value,
			data: { ref: { path: item.ref.path.value, storageId: item.ref.storageId } } as ItemLink,
		});
		const itemsByPath = new Map(
			[firstCategory, secondCategory, existingArticle, draggedArticle].map((item) => [item.ref.path.value, item]),
		);
		const catalog = {
			findItemByItemRef: jest.fn((itemRef: ItemRef) => itemsByPath.get(itemRef.path.value)),
			getRootCategoryRef: () => ref("catalog/_index.md"),
		} as unknown as Catalog;
		const dragTree = new DragTree({} as FileProvider, {} as MakeResourceUpdater);
		const newTree = [
			node(firstCategory, 0),
			node(secondCategory, 0),
			node(existingArticle, secondCategory.ref.path.value),
			node(draggedArticle, secondCategory.ref.path.value),
		];

		const ancestors = await dragTree.findOrderingAncestors(newTree, draggedArticle.ref.path.value, catalog);

		expect(ancestors?.parent).toBe(secondCategory);
		expect(ancestors?.prev).toBe(existingArticle);
	});

	test("returns undefined instead of resolving an absent parent node", async () => {
		const draggedRef = { path: new Path("catalog/article.md"), storageId: "s" };
		const draggedNode = {
			id: draggedRef.path.value,
			parent: "missing-category",
			text: "Article",
			data: { ref: { path: draggedRef.path.value, storageId: draggedRef.storageId } } as ItemLink,
		};
		const catalog = {
			findItemByItemRef: jest.fn(() => ({ ref: draggedRef })),
			getRootCategoryRef: () => ({ path: new Path("catalog/_index.md"), storageId: "s" }),
		} as unknown as Catalog;
		const dragTree = new DragTree({} as FileProvider, {} as MakeResourceUpdater);

		await expect(
			dragTree.findOrderingAncestors([draggedNode], draggedRef.path.value, catalog),
		).resolves.toBeUndefined();
	});
});
