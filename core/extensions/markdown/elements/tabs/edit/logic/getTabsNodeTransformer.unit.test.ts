import type { CatalogView } from "@ext/catalog/views/models/CatalogViews";
import type PrivateParserContext from "@ext/markdown/core/Parser/ParserContext/PrivateParserContext";
import type { PropertyValue } from "@ext/properties/models";
import getTabsNodeTransformer from "./getTabsNodeTransformer";

const makeContext = (resolvedView?: CatalogView): PrivateParserContext =>
	({
		getCatalog: () => ({
			props: { resolvedView },
		}),
	}) as unknown as PrivateParserContext;

const makeTab = (property: PropertyValue[], idx = 0) => ({
	type: "tab",
	attrs: { property, idx },
	content: [],
});

const makeTabsNode = (tabs: ReturnType<typeof makeTab>[], childAttrs?: Record<string, unknown>[]) => ({
	type: "tabs",
	attrs: { childAttrs: childAttrs ?? tabs.map((_, i) => ({ idx: i, label: `Tab ${i}` })) },
	content: tabs,
});

describe("getTabsNodeTransformer", () => {
	describe("when no resolvedView", () => {
		test("returns isSet: false for tabs node", async () => {
			const transform = getTabsNodeTransformer(makeContext(undefined));
			const node = makeTabsNode([makeTab([])]);

			const result = await transform(node);

			expect(result.isSet).toBe(false);
			expect(result.value).toBe(node);
		});
	});

	describe("when node is not tabs type", () => {
		test("returns isSet: false", async () => {
			const view: CatalogView = { id: "v1", name: "V", filters: [], properties: [] };
			const transform = getTabsNodeTransformer(makeContext(view));
			const node = { type: "paragraph", attrs: {}, content: [] };

			const result = await transform(node);

			expect(result.isSet).toBe(false);
		});
	});

	describe("when no tab has attrs.property set", () => {
		test("returns isSet: false and original node without mutation", async () => {
			const view: CatalogView = {
				id: "v1",
				name: "V",
				filters: [{ id: "env", value: ["dev"] }],
				properties: [],
			};
			const transform = getTabsNodeTransformer(makeContext(view));
			const node = makeTabsNode([makeTab([], 0), makeTab([], 1)]);

			const result = await transform(node);

			expect(result.isSet).toBe(false);
			expect(result.value).toBe(node);
			expect(node.content[0].attrs.idx).toBe(0);
			expect(node.content[1].attrs.idx).toBe(1);
		});

		test("treats missing attrs.property like empty", async () => {
			const view: CatalogView = {
				id: "v1",
				name: "V",
				filters: [{ id: "env", value: ["dev"] }],
				properties: [],
			};
			const transform = getTabsNodeTransformer(makeContext(view));
			const node = {
				type: "tabs",
				attrs: { childAttrs: [{ idx: 0, label: "A" }] },
				content: [{ type: "tab", attrs: { idx: 0 }, content: [] }],
			};

			const result = await transform(node);

			expect(result.isSet).toBe(false);
			expect(result.value).toBe(node);
		});
	});

	describe("when resolvedView has no filters", () => {
		test("keeps all tabs", async () => {
			const view: CatalogView = { id: "v1", name: "V", filters: [], properties: [] };
			const transform = getTabsNodeTransformer(makeContext(view));
			const node = makeTabsNode([
				makeTab([{ id: "env", value: ["prod"] }]),
				makeTab([{ id: "env", value: ["dev"] }]),
			]);

			const result = await transform(node);

			expect(result.isSet).toBe(true);
			expect(result.value.content).toHaveLength(2);
		});
	});

	describe("filtering by property value", () => {
		test("removes tab when its property value matches filter value", async () => {
			const view: CatalogView = {
				id: "v1",
				name: "V",
				filters: [{ id: "env", value: ["dev"] }],
				properties: [],
			};
			const transform = getTabsNodeTransformer(makeContext(view));
			const node = makeTabsNode([
				makeTab([{ id: "env", value: ["prod"] }], 0),
				makeTab([{ id: "env", value: ["dev"] }], 1),
				makeTab([{ id: "env", value: ["staging"] }], 2),
			]);

			const result = await transform(node);

			expect(result.isSet).toBe(true);
			expect(result.value.content).toHaveLength(2);
			expect(result.value.content[0].attrs.property[0].value).toEqual(["prod"]);
			expect(result.value.content[1].attrs.property[0].value).toEqual(["staging"]);
		});

		test("removes tab when filter has multiple values and tab matches any", async () => {
			const view: CatalogView = {
				id: "v1",
				name: "V",
				filters: [{ id: "env", value: ["dev", "staging"] }],
				properties: [],
			};
			const transform = getTabsNodeTransformer(makeContext(view));
			const node = makeTabsNode([
				makeTab([{ id: "env", value: ["prod"] }]),
				makeTab([{ id: "env", value: ["dev"] }]),
				makeTab([{ id: "env", value: ["staging"] }]),
			]);

			const result = await transform(node);

			expect(result.value.content).toHaveLength(1);
			expect(result.value.content[0].attrs.property[0].value).toEqual(["prod"]);
		});
	});

	describe("filtering with 'yes' and 'none' special values", () => {
		test("'yes' filter removes tabs that HAVE the property", async () => {
			const view: CatalogView = {
				id: "v1",
				name: "V",
				filters: [{ id: "deprecated", value: ["yes"] }],
				properties: [],
			};
			const transform = getTabsNodeTransformer(makeContext(view));
			const node = makeTabsNode([makeTab([{ id: "deprecated", value: [] }]), makeTab([])]);

			const result = await transform(node);

			expect(result.value.content).toHaveLength(1);
			expect(result.value.content[0].attrs.property).toEqual([]);
		});

		test("'none' filter removes tabs that DO NOT have the property", async () => {
			const view: CatalogView = {
				id: "v1",
				name: "V",
				filters: [{ id: "env", value: ["none"] }],
				properties: [],
			};
			const transform = getTabsNodeTransformer(makeContext(view));
			const node = makeTabsNode([makeTab([{ id: "env", value: ["prod"] }]), makeTab([])]);

			const result = await transform(node);

			expect(result.value.content).toHaveLength(1);
			expect(result.value.content[0].attrs.property[0].value).toEqual(["prod"]);
		});
	});

	describe("index recalculation", () => {
		test("reassigns sequential idx to remaining tabs", async () => {
			const view: CatalogView = {
				id: "v1",
				name: "V",
				filters: [{ id: "env", value: ["dev"] }],
				properties: [],
			};
			const transform = getTabsNodeTransformer(makeContext(view));
			const node = makeTabsNode([
				makeTab([{ id: "env", value: ["dev"] }], 0),
				makeTab([{ id: "env", value: ["prod"] }], 1),
				makeTab([{ id: "env", value: ["staging"] }], 2),
			]);

			const result = await transform(node);

			expect(result.value.content).toHaveLength(2);
			expect(result.value.content[0].attrs.idx).toBe(0);
			expect(result.value.content[1].attrs.idx).toBe(1);
		});

		test("reindexes childAttrs and filters out removed entries", async () => {
			const view: CatalogView = {
				id: "v1",
				name: "V",
				filters: [{ id: "env", value: ["dev"] }],
				properties: [],
			};
			const transform = getTabsNodeTransformer(makeContext(view));
			const childAttrs = [
				{ idx: 0, label: "Dev" },
				{ idx: 1, label: "Prod" },
				{ idx: 2, label: "Stage" },
			];
			const node = makeTabsNode(
				[
					makeTab([{ id: "env", value: ["dev"] }], 0),
					makeTab([{ id: "env", value: ["prod"] }], 1),
					makeTab([{ id: "env", value: ["staging"] }], 2),
				],
				childAttrs,
			);

			const result = await transform(node);

			expect(result.value.attrs.childAttrs).toHaveLength(2);
			expect(result.value.attrs.childAttrs[0]).toEqual({ idx: 0, label: "Prod" });
			expect(result.value.attrs.childAttrs[1]).toEqual({ idx: 1, label: "Stage" });
		});
	});

	describe("multiple filters", () => {
		test("all filters must pass (AND logic)", async () => {
			const view: CatalogView = {
				id: "v1",
				name: "V",
				filters: [
					{ id: "env", value: ["dev"] },
					{ id: "platform", value: ["ios"] },
				],
				properties: [],
			};
			const transform = getTabsNodeTransformer(makeContext(view));
			const node = makeTabsNode([
				makeTab([
					{ id: "env", value: ["dev"] },
					{ id: "platform", value: ["ios"] },
				]),
				makeTab([{ id: "env", value: ["dev"] }]),
				makeTab([{ id: "platform", value: ["ios"] }]),
				makeTab([{ id: "env", value: ["prod"] }]),
			]);

			const result = await transform(node);

			// Tab 0: matches env=dev filter → removed by env, matches platform=ios → removed by platform
			// Tab 1: matches env=dev → removed by env, no platform prop → passes platform
			// Tab 2: no env prop → passes env, matches platform=ios → removed by platform
			// Tab 3: no match → passes both
			expect(result.value.content).toHaveLength(1);
			expect(result.value.content[0].attrs.property[0].value).toEqual(["prod"]);
		});
	});

	describe("non-tab content", () => {
		test("preserves non-tab nodes in content", async () => {
			const view: CatalogView = {
				id: "v1",
				name: "V",
				filters: [{ id: "env", value: ["dev"] }],
				properties: [],
			};
			const transform = getTabsNodeTransformer(makeContext(view));
			const node = {
				type: "tabs",
				attrs: { childAttrs: undefined },
				content: [
					{ type: "other", attrs: {}, content: [] },
					makeTab([{ id: "env", value: ["dev"] }]),
					makeTab([{ id: "env", value: ["prod"] }]),
				],
			};

			const result = await transform(node);

			expect(result.value.content).toHaveLength(2);
			expect(result.value.content[0].type).toBe("other");
			expect(result.value.content[1].type).toBe("tab");
		});
	});
});
