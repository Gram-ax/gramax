import type { RenderableTreeNode } from "@ext/markdown/core/render/logic/Markdoc";
import getTocItems, { getLevelTocItemsByRenderableTree } from "./createTocItems";

describe("getTocItems", () => {
	test("првильно вадает TocItems по levelTocItems", () => {
		const levelTocItems = [
			{ level: 2, url: "", title: "", items: [] },
			{ level: 3, url: "", title: "", items: [] },
			{ level: 2, url: "", title: "", items: [] },
		];

		const testTocItems = [
			{ level: 2, url: "", title: "", items: [{ level: 3, url: "", title: "", items: [] }] },
			{ level: 2, url: "", title: "", items: [] },
		];

		const TocItems = getTocItems(levelTocItems);
		expect(testTocItems).toEqual(TocItems);
	});

	test("првильно вадает2 TocItems по levelTocItems", () => {
		const levelTocItems = [
			{ level: 2, url: "", title: "", items: [] },
			{ level: 3, url: "", title: "", items: [] },
			{ level: 4, url: "", title: "", items: [] },
			{ level: 3, url: "", title: "", items: [] },
			{ level: 4, url: "", title: "", items: [] },
			{ level: 3, url: "", title: "", items: [] },
			{ level: 3, url: "", title: "", items: [] },
			{ level: 2, url: "", title: "", items: [] },
			{ level: 2, url: "", title: "", items: [] },
			{ level: 4, url: "", title: "", items: [] },
		];

		const testTocItems = [
			{
				items: [
					{
						items: [{ items: [], level: 4, title: "", url: "" }],
						level: 3,
						title: "",
						url: "",
					},
					{
						items: [{ items: [], level: 4, title: "", url: "" }],
						level: 3,
						title: "",
						url: "",
					},
					{ items: [], level: 3, title: "", url: "" },
					{ items: [], level: 3, title: "", url: "" },
				],
				level: 2,
				title: "",
				url: "",
			},
			{ items: [], level: 2, title: "", url: "" },
			{
				items: [{ items: [], level: 4, title: "", url: "" }],
				level: 2,
				title: "",
				url: "",
			},
		];

		const TocItems = getTocItems(levelTocItems);
		expect(testTocItems).toEqual(TocItems);
	});

	test("includes headings from a fragment in the render tree", () => {
		const tags = [
			{
				// biome-ignore lint/style/useNamingConvention: Markdoc tag protocol field
				$$mdtype: "Tag",
				name: "Heading",
				attributes: { level: 2 },
				children: ["Article heading"],
			},
			{
				// biome-ignore lint/style/useNamingConvention: Markdoc tag protocol field
				$$mdtype: "Tag",
				name: "fragment",
				attributes: {
					content: [
						{
							// biome-ignore lint/style/useNamingConvention: Markdoc tag protocol field
							$$mdtype: "Tag",
							name: "Heading",
							attributes: { level: 3, id: "fragment-heading" },
							children: ["Fragment heading"],
						},
					],
				},
				children: [],
			},
		] as unknown as RenderableTreeNode[];

		expect(getTocItems(getLevelTocItemsByRenderableTree(tags))).toEqual([
			{
				level: 2,
				url: "#article-heading",
				title: "Article heading",
				items: [{ level: 3, url: "#fragment-heading", title: "Fragment heading", items: [] }],
			},
		]);
	});

	test("accepts embedded navigation through the generic navigation attribute", () => {
		const tags = [
			{
				// biome-ignore lint/style/useNamingConvention: Markdoc tag protocol field
				$$mdtype: "Tag",
				name: "AnyExtension",
				attributes: {
					navigation: [
						{
							url: "#group",
							title: "Group",
							items: [{ url: "#operation", title: "Operation", items: [] }],
						},
					],
				},
				children: [],
			},
		] as unknown as RenderableTreeNode[];

		expect(getTocItems(getLevelTocItemsByRenderableTree(tags))).toEqual([
			{
				level: 0,
				url: "#group",
				title: "Group",
				items: [{ url: "#operation", title: "Operation", items: [] }],
				isEmbedded: true,
			},
		]);
	});
});
