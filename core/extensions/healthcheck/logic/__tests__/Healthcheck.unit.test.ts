import Path from "@core/FileProvider/Path/Path";
import type { Article } from "@core/FileStructue/Article/Article";
import type ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import Healthcheck from "@ext/healthcheck/logic/Healthcheck";

test("all links processed", async () => {
	const item = {
		props: {},
		logicPath: "test",
		getTitle: () => "title",
		ref: { path: { value: "p" } },
		parsedContent: {
			read: async (fn: any) =>
				fn({
					parsedContext: {
						getLinkManager: () => ({
							linkResources: linksToCheck,
							resources: [new Path(`res.md`)],
						}),
						getResourceManager: () => ({
							resources: [],
							exists: () => true,
							getAbsolutePath: (path) => path,
						}),
						icons: [],
					},
					renderTree: null,
					tocItems: [],
				}),
		},
	} as Article;

	const healthcheck = new Healthcheck(
		{} as any,
		{
			props: {},
			ctx: { contentLanguage: "en", user: { type: "base" } },
			getContentItems: () => [item],
			getCategories: () => [],
			customProviders: {
				iconProvider: { getIconByCode: async () => null },
				commentProvider: {
					getComments: async () => null,
					isAssigned: () => true,
				},
			},
			getPathnameData: (item) => ({ catalogName: "title", itemLogicPath: item.logicPath }),
		} as any as ContextualCatalog,
	);

	const linksToCheck = Array.from({ length: 7 }, (_, i) => ({
		resource: new Path(`res.md`),
		hash: `#h${i}`,
	}));

	const checkResult = await healthcheck.checkCatalog();

	expect(checkResult.links.length).toBe(7);
});
