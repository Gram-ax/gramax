import type { ItemLink } from "@ext/navigation/NavigationLinks";
import { createItemLinksStore, shouldReplaceItemLinks } from "./ItemLinksStore";

const mkLink = (path: string, title: string, items?: ItemLink[]): ItemLink =>
	({ ref: { path }, title, items }) as unknown as ItemLink;

describe("ItemLinksStore", () => {
	test("setItemLinks replaces the tree", () => {
		const store = createItemLinksStore();
		store.getState().setItemLinks([mkLink("a.md", "A")]);
		expect(store.getState().itemLinks).toHaveLength(1);
	});

	test("patchItemProps updates matching top-level link title", () => {
		const store = createItemLinksStore({ itemLinks: [mkLink("a.md", "A"), mkLink("b.md", "B")] });
		store.getState().patchItemProps([{ path: "a.md", props: { title: "A-new" } }]);
		const links = store.getState().itemLinks;
		expect(links[0].title).toBe("A-new");
		expect(links[1].title).toBe("B");
	});

	test("patchItemProps recurses into nested items", () => {
		const store = createItemLinksStore({
			itemLinks: [mkLink("root.md", "Root", [mkLink("nested.md", "Nested")])],
		});
		store.getState().patchItemProps([{ path: "nested.md", props: { title: "Nested-new" } }]);
		const links = store.getState().itemLinks;
		expect((links[0] as unknown as { items: ItemLink[] }).items[0].title).toBe("Nested-new");
	});

	test("patchItemProps returns identical reference when no match", () => {
		const initial: ItemLink[] = [mkLink("a.md", "A")];
		const store = createItemLinksStore({ itemLinks: initial });
		store.getState().patchItemProps([{ path: "nonexistent.md", props: { title: "X" } }]);
		expect(store.getState().itemLinks).toBe(initial);
	});

	test("patchItemProps no-ops on empty patches", () => {
		const initial: ItemLink[] = [mkLink("a.md", "A")];
		const store = createItemLinksStore({ itemLinks: initial });
		store.getState().patchItemProps([]);
		expect(store.getState().itemLinks).toBe(initial);
	});

	test("patchItemProps preserves unchanged sibling references", () => {
		const sibling = mkLink("b.md", "B");
		const store = createItemLinksStore({ itemLinks: [mkLink("a.md", "A"), sibling] });
		store.getState().patchItemProps([{ path: "a.md", props: { title: "A-new" } }]);
		const links = store.getState().itemLinks;
		expect(links[1]).toBe(sibling);
	});
});

describe("shouldReplaceItemLinks", () => {
	const a = [mkLink("a.md", "A")];

	test("empty incoming never wipes a populated tree", () => {
		expect(shouldReplaceItemLinks([], a)).toBe(false);
	});

	test("non-empty incoming replaces", () => {
		expect(shouldReplaceItemLinks(a, [])).toBe(true);
		expect(shouldReplaceItemLinks(a, [mkLink("b.md", "B")])).toBe(true);
	});

	test("empty incoming allowed only when store already empty", () => {
		expect(shouldReplaceItemLinks([], [])).toBe(true);
	});
});
