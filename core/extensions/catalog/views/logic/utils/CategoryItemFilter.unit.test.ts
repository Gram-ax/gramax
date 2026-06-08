/** biome-ignore-all lint/suspicious/noExplicitAny: expected */
import { ItemType } from "@core/FileStructue/Item/ItemType";
import type { CatalogView } from "@ext/catalog/views/models/CatalogViews";
import type { PropertyValue } from "@ext/properties/models";
import CategoryItemFilter from "./CategoryItemFilter";

const makeArticle = (properties?: PropertyValue[]) =>
	({
		type: ItemType.article,
		props: { properties },
	}) as any;

const makeCategory = (properties?: PropertyValue[], items: any[] = []) =>
	({
		type: ItemType.category,
		props: { properties },
		items,
	}) as any;

const makeView = (filters: PropertyValue[]): CatalogView => ({
	id: "v1",
	name: "View",
	filters,
	properties: [],
});

const filter = new CategoryItemFilter();

describe("CategoryItemFilter.filter", () => {
	test("returns all items when filters is empty", () => {
		const items = [makeArticle(), makeCategory()];
		const view = makeView([]);
		expect(filter.filter(items, view)).toHaveLength(2);
	});

	test("returns all items when filters is undefined", () => {
		const items = [makeArticle(), makeCategory()];
		const view = { ...makeView([]), filters: undefined as any };
		expect(filter.filter(items, view)).toHaveLength(2);
	});

	test("keeps article matching filter", () => {
		const items = [makeArticle([{ id: "status", value: ["draft"] }])];
		const view = makeView([{ id: "status", value: ["draft"] }]);
		expect(filter.filter(items, view)).toHaveLength(0);
	});

	test("keeps article not matching filter", () => {
		const items = [makeArticle([{ id: "status", value: ["published"] }])];
		const view = makeView([{ id: "status", value: ["draft"] }]);
		expect(filter.filter(items, view)).toHaveLength(1);
	});

	test("keeps category with no filtered children (category itself passes matchesFilter)", () => {
		const child = makeArticle([{ id: "status", value: ["draft"] }]);
		const category = makeCategory([], [child]);
		const view = makeView([{ id: "status", value: ["draft"] }]);
		expect(filter.filter([category], view, (c) => c.items)).toHaveLength(1);
	});

	test("keeps category with at least one filtered child", () => {
		const child = makeArticle([{ id: "status", value: ["published"] }]);
		const category = makeCategory([], [child]);
		const view = makeView([{ id: "status", value: ["draft"] }]);
		expect(filter.filter([category], view, (c) => c.items)).toHaveLength(1);
	});

	test("keeps nested category with no filtered children (category itself passes matchesFilter)", () => {
		const article = makeArticle([{ id: "status", value: ["draft"] }]);
		const inner = makeCategory([], [article]);
		const outer = makeCategory([], [inner]);
		const view = makeView([{ id: "status", value: ["draft"] }]);
		expect(filter.filter([outer], view, (c) => c.items)).toHaveLength(1);
	});

	test("keeps nested category if grandchild passes filter", () => {
		const article = makeArticle([{ id: "status", value: ["published"] }]);
		const inner = makeCategory([], [article]);
		const outer = makeCategory([], [inner]);
		const view = makeView([{ id: "status", value: ["draft"] }]);
		expect(filter.filter([outer], view, (c) => c.items)).toHaveLength(1);
	});
});

describe("CategoryItemFilter.matchesFilter", () => {
	test("returns true when no filters", () => {
		const item = makeArticle();
		expect(filter.matchesFilter(item, makeView([]))).toBe(true);
	});

	test("returns true when item has no matching property", () => {
		const item = makeArticle([{ id: "other", value: ["x"] }]);
		const view = makeView([{ id: "status", value: ["draft"] }]);
		expect(filter.matchesFilter(item, view)).toBe(true);
	});

	test("returns false when item property value is fully included in filter value", () => {
		const item = makeArticle([{ id: "status", value: ["draft"] }]);
		const view = makeView([{ id: "status", value: ["draft", "published"] }]);
		expect(filter.matchesFilter(item, view)).toBe(false);
	});

	test("returns true when item property value is only partially included in filter value", () => {
		const item = makeArticle([{ id: "status", value: ["draft", "review"] }]);
		const view = makeView([{ id: "status", value: ["draft"] }]);
		expect(filter.matchesFilter(item, view)).toBe(true);
	});

	test("filter value 'yes' — returns false (excludes) when item has the property", () => {
		const item = makeArticle([{ id: "featured", value: ["something"] }]);
		const view = makeView([{ id: "featured", value: ["yes"] }]);
		expect(filter.matchesFilter(item, view)).toBe(false);
	});

	test("filter value 'yes' — returns true (keeps) when item does not have the property", () => {
		const item = makeArticle();
		const view = makeView([{ id: "featured", value: ["yes"] }]);
		expect(filter.matchesFilter(item, view)).toBe(true);
	});

	test("filter value 'none' — returns true (keeps) when item has the property", () => {
		const item = makeArticle([{ id: "featured", value: ["something"] }]);
		const view = makeView([{ id: "featured", value: ["none"] }]);
		expect(filter.matchesFilter(item, view)).toBe(true);
	});

	test("filter value 'none' — returns false (excludes) when item does not have the property", () => {
		const item = makeArticle();
		const view = makeView([{ id: "featured", value: ["none"] }]);
		expect(filter.matchesFilter(item, view)).toBe(false);
	});

	test("all filters must pass — returns false if any filter excludes", () => {
		const item = makeArticle([
			{ id: "status", value: ["draft"] },
			{ id: "type", value: ["post"] },
		]);
		const view = makeView([
			{ id: "status", value: ["draft"] },
			{ id: "type", value: ["page"] },
		]);
		expect(filter.matchesFilter(item, view)).toBe(false);
	});

	test("item property with empty value does not trigger exclusion", () => {
		const item = makeArticle([{ id: "status", value: [] }]);
		const view = makeView([{ id: "status", value: ["draft"] }]);
		expect(filter.matchesFilter(item, view)).toBe(true);
	});

	test("filter with undefined value does not exclude", () => {
		const item = makeArticle([{ id: "status", value: ["draft"] }]);
		const view = makeView([{ id: "status", value: undefined }]);
		expect(filter.matchesFilter(item, view)).toBe(true);
	});

	test("filter value 'none' + 'yes' simultaneously — always returns false (hides item)", () => {
		const itemWithProperty = makeArticle([{ id: "featured", value: ["something"] }]);
		const itemWithoutProperty = makeArticle();
		const view = makeView([{ id: "featured", value: ["none", "yes"] }]);
		expect(filter.matchesFilter(itemWithProperty, view)).toBe(false);
		expect(filter.matchesFilter(itemWithoutProperty, view)).toBe(false);
	});
});
