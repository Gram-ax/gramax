import type FileProvider from "@core/FileProvider/model/FileProvider";
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
			read: async (fn: (content: unknown) => unknown) =>
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
		{} as FileProvider,
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
		} as unknown as ContextualCatalog,
	);

	const linksToCheck = Array.from({ length: 7 }, (_, i) => ({
		resource: new Path(`res.md`),
		hash: `#h${i}`,
	}));

	const checkResult = await healthcheck.checkCatalog();

	expect(checkResult.links.length).toBe(7);
});

test("alias diagnostics surface as catalog errors with catalog-relative paths", async () => {
	// The searcher's AliasIndex reports diagnostics with root-prefixed logic paths;
	// healthcheck must display them relative to the catalog and point at the owner
	// (for duplicates — at the loser, the item whose claim was ignored).
	const healthcheck = new Healthcheck(
		{} as FileProvider,
		{
			props: {},
			ctx: { contentLanguage: "en", user: { type: "base" } },
			getContentItems: () => [],
			getCategories: () => [],
			findArticle: () => undefined,
			deref: {
				aliases: {
					diagnostics: () => [
						{ kind: "self-alias", owner: "cat/guide", path: "cat/guide" },
						{ kind: "duplicate", path: "cat/legacy", winner: "cat/a", loser: "cat/b" },
					],
				},
				relativeLogicPath: (logicPath: string) => logicPath.replace(/^cat\//, ""),
			},
		} as unknown as ContextualCatalog,
	);

	const checkResult = await healthcheck.checkCatalog();

	expect(checkResult.aliases.length).toBe(2);
	expect(checkResult.aliases[0].args.value).toContain(": guide");
	expect(checkResult.aliases[0].args.logicPath).toBe("cat/guide");
	expect(checkResult.aliases[1].args.value).toContain(": legacy");
	expect(checkResult.aliases[1].args.logicPath).toBe("cat/b");
});

test("a link whose relative path escapes the catalog root is reported, not thrown (#813)", async () => {
	// A link like `../../342/_index.md` resolves outside the catalog root; the
	// FileProvider rejects the existence probe with WouldEscape. Healthcheck must
	// treat such a reference as broken and keep scanning instead of aborting.
	const escaping = new Path("../../342/_index.md");
	const item = {
		props: {},
		logicPath: "test",
		getTitle: () => "title",
		ref: { path: { value: "p" } },
		parsedContent: {
			read: async (fn: (content: unknown) => unknown) =>
				fn({
					parsedContext: {
						getLinkManager: () => ({
							linkResources: [],
							resources: [escaping],
						}),
						getResourceManager: () => ({
							resources: [],
							exists: () => {
								throw new Error(
									"WouldEscape: The provided path '../../342/_index.md' would escape its root '/root'",
								);
							},
							getAbsolutePath: (path: Path) => path,
						}),
						icons: [],
					},
					renderTree: null,
					tocItems: [],
				}),
		},
	} as unknown as Article;

	const healthcheck = new Healthcheck(
		{} as FileProvider,
		{
			props: {},
			ctx: { contentLanguage: "en", user: { type: "base" } },
			getContentItems: () => [item],
			getCategories: () => [],
			customProviders: {
				iconProvider: { getIconByCode: async () => null },
				commentProvider: { getComments: async () => null, isAssigned: () => true },
			},
			getPathnameData: (item: Article) => ({ catalogName: "title", itemLogicPath: item.logicPath }),
		} as unknown as ContextualCatalog,
	);

	const checkResult = await healthcheck.checkCatalog();

	expect(checkResult.links.length).toBe(1);
	expect(checkResult.links[0].args.value).toContain("342/_index.md");
});
