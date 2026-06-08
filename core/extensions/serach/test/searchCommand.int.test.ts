import getApp from "@app/browser/app";
import { createCommands } from "@app/commands";
import searchCommand from "@app/commands/search/searchCommand";
import TestContext from "@app/test/TestContext";
import type Application from "@app/types/Application";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import { ContentLanguage } from "@ext/localization/core/model/Language";
import Permission from "@ext/security/logic/Permission/Permission";
import StrictPermissionMap from "@ext/security/logic/PermissionMap/StrictPermissionMap";
import User from "@ext/security/logic/User/User";
import { resolve } from "path";

process.env.ROOT_PATH = resolve(__dirname, "search_tests");
const p = (s: string) => new Path(s);
const dfp = new DiskFileProvider(p(process.env.ROOT_PATH));

class RoleUser extends User {
	constructor(catalogPerms: Record<string, string[]> = {}) {
		const permsMap = Object.fromEntries(
			Object.entries(catalogPerms).map(([name, values]) => [name, new Permission(values)]),
		);
		super(true, undefined, undefined, undefined, new StrictPermissionMap(permsMap));
	}
	override get type() {
		return "enterprise" as const;
	}
}

interface ArticleArgs {
	title: string;
	body?: string;
	private?: boolean;
	hidden?: boolean;
	properties?: string;
}

const article = (args: ArticleArgs) => {
	return `---
title: ${args.title}
${args.private ? "private: true" : ""}
${args.hidden ? "hidden: true" : ""}
${
	args.properties
		? `properties:
${args.properties}`
		: ""
}
---

${args.body ?? "body"}`;
};

const catalogRoot = (title: string, extra = "") => `title: ${title}\nurl: ${title}\n${extra}\n`;
const marksToText = (marks: { text: string }[]) => marks.map((x) => x.text).join("");

const propsCatalogRoot = `title: propsCat
url: propsCat
properties:
  - name: Status
    type: Enum
    style: blue
    values:
      - open
      - done
  - name: Important
    type: Flag
    style: green
  - name: Assignee
    type: Enum
    style: purple
    values:
      - alice
      - bob
`;

const setupApp = async (): Promise<Application> => {
	delete global.app;
	delete global.commands;
	delete global.config;
	const app = await getApp();
	createCommands(app);
	await app.searcherManager.getSearcher().updateIndex({ force: true });
	return app;
};

describe("searchCommand", () => {
	beforeAll(async () => {
		await dfp.delete(p("."));

		await dfp.write(p("docsA/.doc-root.yaml"), catalogRoot("docsA"));
		await dfp.write(p("docsA/alpha.md"), article({ title: "Alpha Title", body: "alpha body text" }));
		await dfp.write(
			p("docsA/sharedWord.md"),
			article({ title: "Shared Title A", body: "content in docsA catalog" }),
		);
		await dfp.write(
			p("docsA/section/_index.md"),
			article({ title: "Alpha Section", body: "section index with shared marker" }),
		);
		await dfp.write(
			p("docsA/section/inner.md"),
			article({ title: "Inner Article", body: "nested shared marker inside section" }),
		);
		await dfp.write(
			p("docsA/outside.md"),
			article({ title: "Outside Article", body: "shared marker outside section" }),
		);

		await dfp.write(p("docsB/.doc-root.yaml"), catalogRoot("docsB"));
		await dfp.write(p("docsB/beta.md"), article({ title: "Beta Title", body: "beta body" }));
		await dfp.write(
			p("docsB/sharedWord.md"),
			article({ title: "Shared Title B", body: "content in docsB catalog" }),
		);

		await dfp.write(p("secret/.doc-root.yaml"), catalogRoot("secret", "private: true"));
		await dfp.write(p("secret/secret-article.md"), article({ title: "Secret Title", body: "top secret body" }));

		await dfp.write(p("mixed/.doc-root.yaml"), catalogRoot("mixed"));
		await dfp.write(p("mixed/public-article.md"), article({ title: "Mixed Public", body: "mixed public body" }));
		await dfp.write(
			p("mixed/restricted-article.md"),
			article({ title: "Mixed Restricted", body: "mixed restricted body", hidden: true, private: true }),
		);

		await dfp.write(p("propsCat/.doc-root.yaml"), propsCatalogRoot);
		await dfp.write(
			p("propsCat/alpha.md"),
			article({
				title: "Props Alpha",
				body: "propmarker content",
				properties:
					"  - name: Status\n    value: open\n  - name: Important\n  - name: Assignee\n    value: alice\n",
			}),
		);
		await dfp.write(
			p("propsCat/beta.md"),
			article({
				title: "Props Beta",
				body: "propmarker content",
				properties: "  - name: Status\n    value: done\n  - name: Assignee\n    value: bob\n",
			}),
		);
		await dfp.write(p("propsCat/gamma.md"), article({ title: "Props Gamma", body: "propmarker content" }));
		await dfp.write(
			p("propsCat/delta.md"),
			article({
				title: "Props Delta",
				body: "propmarker content",
				properties: "  - name: Status\n    value: open\n  - name: Important\n",
			}),
		);
		await dfp.write(
			p("propsCat/section/_index.md"),
			article({ title: "Props Section", body: "propmarker section index", properties: "  - name: Important\n" }),
		);
		await dfp.write(
			p("propsCat/section/inner-flag.md"),
			article({
				title: "Props Section Inner Flag",
				body: "propmarker inner flag",
				properties: "  - name: Status\n    value: open\n  - name: Important\n",
			}),
		);
		await dfp.write(
			p("propsCat/section/inner-plain.md"),
			article({
				title: "Props Section Inner Plain",
				body: "propmarker inner plain",
				properties: "  - name: Status\n    value: done\n",
			}),
		);

		await dfp.write(
			p("localized/.doc-root.yaml"),
			`${catalogRoot("localized")}language: ru\nsupportedLanguages:\n  - ru\n  - en\n`,
		);
		await dfp.write(
			p("localized/root-search.md"),
			article({ title: "Localized Root Search", body: "localizedtoken en" }),
		);
		await dfp.write(p("localized/en/_index.md"), article({ title: "en", body: "pseudo language root" }));
		await dfp.write(
			p("localized/en/search.md"),
			article({ title: "Localized EN Search", body: "localizedtoken en" }),
		);
		await dfp.write(
			p("localized/en/section/_index.md"),
			article({ title: "Localized EN Section", body: "localizedtoken section" }),
		);
		await dfp.write(
			p("localized/en/section/inside.md"),
			article({ title: "Localized EN Section Inside", body: "localizedtoken inside" }),
		);
	});

	afterAll(async () => {
		await dfp.delete(p("."));
		delete global.app;
		delete global.commands;
		delete global.config;
	});

	test("homepage search includes catalog results matching by catalog title", async () => {
		await setupApp();

		const results = await searchCommand.do({ ctx: new TestContext(), query: "docsA" });
		const catalogNames = results.filter((r) => r.type === "catalog").map((r) => r.name);

		expect(catalogNames).toContain("docsA");
	});

	test("catalog-scoped search does not return catalog results", async () => {
		await setupApp();

		const results = await searchCommand.do({
			ctx: new TestContext(),
			query: "docsA",
			catalogName: "docsA",
		});

		expect(results.every((r) => r.type === "article")).toBe(true);
	});

	test("search restricted by catalogNames only returns articles from those catalogs", async () => {
		await setupApp();

		const results = await searchCommand.do({
			ctx: new TestContext(),
			query: "Shared",
			catalogNames: ["docsA"],
		});

		const articleCatalogs = results.filter((r) => r.type === "article").map((r) => r.catalog.name);

		expect(articleCatalogs).toEqual(expect.arrayContaining(["docsA"]));
		expect(articleCatalogs).not.toContain("docsB");
	});

	test("search restricted by catalogNames also returns matching catalog entries", async () => {
		await setupApp();

		const results = await searchCommand.do({
			ctx: new TestContext(),
			query: "docsB",
			catalogNames: ["docsA", "docsB"],
		});

		const catalogMatches = results.filter((r) => r.type === "catalog").map((r) => r.name);

		expect(catalogMatches).toContain("docsB");
	});

	test("catalogNames does not bypass permissions for inaccessible catalogs", async () => {
		await setupApp();

		const outsider = new TestContext({ user: new RoleUser() });

		const results = await searchCommand.do({
			ctx: outsider,
			query: "Secret",
			catalogNames: ["secret"],
		});

		expect(results).toEqual([]);
	});

	test("search scoped to a catalog returns only that catalog's articles", async () => {
		await setupApp();

		const results = await searchCommand.do({
			ctx: new TestContext(),
			query: "Shared",
			catalogName: "docsA",
		});

		const articleCatalogs = results.filter((r) => r.type === "article").map((r) => r.catalog.name);

		expect(articleCatalogs).toEqual(expect.arrayContaining(["docsA"]));
		expect(articleCatalogs).not.toContain("docsB");
	});

	test("'in this section' search returns only the article and its descendants", async () => {
		await setupApp();

		const results = await searchCommand.do({
			ctx: new TestContext(),
			query: "shared marker",
			catalogName: "docsA",
			articleRefFilter: "docsA/section/_index.md",
		});

		const refPaths = results.filter((r) => r.type === "article").map((r) => r.refPath);

		expect(refPaths).toEqual(expect.arrayContaining(["docsA/section/_index.md", "docsA/section/inner.md"]));
		expect(refPaths).not.toContain("docsA/outside.md");
	});

	test("restricted article is excluded from search results", async () => {
		await setupApp();

		const results = await searchCommand.do({
			ctx: new TestContext(),
			query: "mixed",
			catalogName: "mixed",
		});

		const refPaths = results.filter((r) => r.type === "article").map((r) => r.refPath);

		expect(refPaths).toContain("mixed/public-article.md");
		expect(refPaths).not.toContain("mixed/restricted-article.md");
	});

	test("private catalog: user with matching catalog permission sees results, user without does not", async () => {
		await setupApp();

		const reader = new TestContext({ user: new RoleUser({ secret: ["ics-it"] }) });
		const outsider = new TestContext({ user: new RoleUser() });

		const readerHomepage = await searchCommand.do({ ctx: reader, query: "Secret" });
		expect(readerHomepage.some((r) => r.type === "article" && r.catalog.name === "secret")).toBe(true);

		const outsiderHomepage = await searchCommand.do({ ctx: outsider, query: "Secret" });
		expect(outsiderHomepage.some((r) => r.type === "article" && r.catalog.name === "secret")).toBe(false);

		const readerScoped = await searchCommand.do({ ctx: reader, query: "Secret", catalogName: "secret" });
		expect(readerScoped.some((r) => r.type === "article" && r.refPath === "secret/secret-article.md")).toBe(true);

		const outsiderScoped = await searchCommand.do({ ctx: outsider, query: "Secret", catalogName: "secret" });
		expect(outsiderScoped).toEqual([]);
	});

	test("article in a private catalog: user with permission sees the article, user without does not", async () => {
		await setupApp();

		const reader = new TestContext({ user: new RoleUser({ secret: ["ics-it"] }) });
		const outsider = new TestContext({ user: new RoleUser() });

		const readerResults = await searchCommand.do({ ctx: reader, query: "top secret", catalogName: "secret" });
		expect(readerResults.some((r) => r.type === "article" && r.refPath === "secret/secret-article.md")).toBe(true);

		const outsiderResults = await searchCommand.do({
			ctx: outsider,
			query: "top secret",
			catalogName: "secret",
		});
		expect(outsiderResults).toEqual([]);
	});

	test('localized catalog search by "en" does not return language pseudo category', async () => {
		await setupApp();

		const results = await searchCommand.do({
			ctx: new TestContext({ contentLanguage: ContentLanguage.en }),
			query: "en",
			catalogName: "localized",
		});

		const refPaths = results.filter((r) => r.type === "article").map((r) => r.refPath);
		expect(refPaths).not.toContain("localized/en/_index.md");
	});

	test("localized catalog search excludes language pseudo category from breadcrumbs", async () => {
		await setupApp();

		const results = await searchCommand.do({
			ctx: new TestContext({ contentLanguage: ContentLanguage.en }),
			query: "localizedtoken",
			catalogName: "localized",
		});

		const articleResults = results.filter((r) => r.type === "article");
		const breadcrumbTitles = articleResults.flatMap((r) => r.breadcrumbs.map((x) => marksToText(x.title)));
		expect(breadcrumbTitles).not.toContain("en");
	});

	describe("propertyFilter", () => {
		const refPathsOf = (results: Awaited<ReturnType<typeof searchCommand.do>>) =>
			results.filter((r) => r.type === "article").map((r) => r.refPath);

		test("flag property: eq true returns only articles with that flag set", async () => {
			await setupApp();

			const results = await searchCommand.do({
				ctx: new TestContext(),
				query: "propmarker",
				catalogName: "propsCat",
				propertyFilter: {
					op: "and",
					filters: [{ op: "eq", key: "Important", value: true }],
				},
			});

			expect(refPathsOf(results)).toEqual(expect.arrayContaining(["propsCat/alpha.md", "propsCat/delta.md"]));
			expect(refPathsOf(results)).not.toContain("propsCat/beta.md");
			expect(refPathsOf(results)).not.toContain("propsCat/gamma.md");
		});

		test("enum property: contains with single value returns matching articles", async () => {
			await setupApp();

			const results = await searchCommand.do({
				ctx: new TestContext(),
				query: "propmarker",
				catalogName: "propsCat",
				propertyFilter: {
					op: "and",
					filters: [{ op: "contains", key: "Status", list: ["open"] }],
				},
			});

			expect(refPathsOf(results)).toEqual(expect.arrayContaining(["propsCat/alpha.md", "propsCat/delta.md"]));
			expect(refPathsOf(results)).not.toContain("propsCat/beta.md");
			expect(refPathsOf(results)).not.toContain("propsCat/gamma.md");
		});

		test("enum property: contains with multiple values returns union", async () => {
			await setupApp();

			const results = await searchCommand.do({
				ctx: new TestContext(),
				query: "propmarker",
				catalogName: "propsCat",
				propertyFilter: {
					op: "and",
					filters: [{ op: "contains", key: "Assignee", list: ["alice", "bob"] }],
				},
			});

			expect(refPathsOf(results)).toEqual(expect.arrayContaining(["propsCat/alpha.md", "propsCat/beta.md"]));
			expect(refPathsOf(results)).not.toContain("propsCat/gamma.md");
			expect(refPathsOf(results)).not.toContain("propsCat/delta.md");
		});

		test("isEmpty: returns only articles without the property", async () => {
			await setupApp();

			const results = await searchCommand.do({
				ctx: new TestContext(),
				query: "propmarker",
				catalogName: "propsCat",
				propertyFilter: {
					op: "and",
					filters: [{ op: "isEmpty", key: "Status" }],
				},
			});

			const refs = refPathsOf(results);
			expect(refs).toEqual(expect.arrayContaining(["propsCat/gamma.md", "propsCat/section/_index.md"]));
			expect(refs).not.toContain("propsCat/alpha.md");
			expect(refs).not.toContain("propsCat/beta.md");
			expect(refs).not.toContain("propsCat/delta.md");
			expect(refs).not.toContain("propsCat/section/inner-flag.md");
			expect(refs).not.toContain("propsCat/section/inner-plain.md");
		});

		test("isEmpty on flag: returns articles where flag not set", async () => {
			await setupApp();

			const results = await searchCommand.do({
				ctx: new TestContext(),
				query: "propmarker",
				catalogName: "propsCat",
				propertyFilter: {
					op: "and",
					filters: [{ op: "isEmpty", key: "Important" }],
				},
			});

			expect(refPathsOf(results)).toEqual(expect.arrayContaining(["propsCat/beta.md", "propsCat/gamma.md"]));
			expect(refPathsOf(results)).not.toContain("propsCat/alpha.md");
			expect(refPathsOf(results)).not.toContain("propsCat/delta.md");
		});

		test("or: value or empty returns both matched and missing", async () => {
			await setupApp();

			const results = await searchCommand.do({
				ctx: new TestContext(),
				query: "propmarker",
				catalogName: "propsCat",
				propertyFilter: {
					op: "and",
					filters: [
						{
							op: "or",
							filters: [
								{ op: "contains", key: "Status", list: ["open"] },
								{ op: "isEmpty", key: "Status" },
							],
						},
					],
				},
			});

			expect(refPathsOf(results)).toEqual(
				expect.arrayContaining(["propsCat/alpha.md", "propsCat/delta.md", "propsCat/gamma.md"]),
			);
			expect(refPathsOf(results)).not.toContain("propsCat/beta.md");
		});

		test("and: multiple properties intersected", async () => {
			await setupApp();

			const results = await searchCommand.do({
				ctx: new TestContext(),
				query: "propmarker",
				catalogName: "propsCat",
				propertyFilter: {
					op: "and",
					filters: [
						{ op: "contains", key: "Status", list: ["open"] },
						{ op: "eq", key: "Important", value: true },
					],
				},
			});

			expect(refPathsOf(results)).toEqual(expect.arrayContaining(["propsCat/alpha.md", "propsCat/delta.md"]));
			expect(refPathsOf(results)).not.toContain("propsCat/beta.md");
			expect(refPathsOf(results)).not.toContain("propsCat/gamma.md");
		});

		test("contains with empty list matches nothing", async () => {
			await setupApp();

			const results = await searchCommand.do({
				ctx: new TestContext(),
				query: "propmarker",
				catalogName: "propsCat",
				propertyFilter: {
					op: "and",
					filters: [{ op: "contains", key: "Status", list: [] }],
				},
			});

			expect(refPathsOf(results)).toEqual([]);
		});

		test("contains with non-existent value matches nothing", async () => {
			await setupApp();

			const results = await searchCommand.do({
				ctx: new TestContext(),
				query: "propmarker",
				catalogName: "propsCat",
				propertyFilter: {
					op: "and",
					filters: [{ op: "contains", key: "Status", list: ["archived"] }],
				},
			});

			expect(refPathsOf(results)).toEqual([]);
		});

		test("no query + eq flag: returns all articles with flag set", async () => {
			await setupApp();

			const results = await searchCommand.do({
				ctx: new TestContext(),
				query: undefined,
				catalogName: "propsCat",
				propertyFilter: {
					op: "and",
					filters: [{ op: "eq", key: "Important", value: true }],
				},
			});

			const refs = refPathsOf(results);
			expect(refs).toEqual(
				expect.arrayContaining([
					"propsCat/alpha.md",
					"propsCat/delta.md",
					"propsCat/section/_index.md",
					"propsCat/section/inner-flag.md",
				]),
			);
			expect(refs).not.toContain("propsCat/beta.md");
			expect(refs).not.toContain("propsCat/gamma.md");
			expect(refs).not.toContain("propsCat/section/inner-plain.md");
		});

		test("no query + contains enum: returns all articles with matching value", async () => {
			await setupApp();

			const results = await searchCommand.do({
				ctx: new TestContext(),
				query: undefined,
				catalogName: "propsCat",
				propertyFilter: {
					op: "and",
					filters: [{ op: "contains", key: "Status", list: ["done"] }],
				},
			});

			const refs = refPathsOf(results);
			expect(refs).toEqual(expect.arrayContaining(["propsCat/beta.md", "propsCat/section/inner-plain.md"]));
			expect(refs).not.toContain("propsCat/alpha.md");
			expect(refs).not.toContain("propsCat/delta.md");
		});

		test("no query + isEmpty: returns articles without the property", async () => {
			await setupApp();

			const results = await searchCommand.do({
				ctx: new TestContext(),
				query: undefined,
				catalogName: "propsCat",
				propertyFilter: {
					op: "and",
					filters: [{ op: "isEmpty", key: "Status" }],
				},
			});

			const refs = refPathsOf(results);
			expect(refs).toEqual(expect.arrayContaining(["propsCat/gamma.md", "propsCat/section/_index.md"]));
			expect(refs).not.toContain("propsCat/alpha.md");
			expect(refs).not.toContain("propsCat/beta.md");
			expect(refs).not.toContain("propsCat/delta.md");
			expect(refs).not.toContain("propsCat/section/inner-flag.md");
			expect(refs).not.toContain("propsCat/section/inner-plain.md");
		});

		test("articleRefFilter + eq flag: limits to section's articles and filters by flag", async () => {
			await setupApp();

			const results = await searchCommand.do({
				ctx: new TestContext(),
				query: "propmarker",
				catalogName: "propsCat",
				articleRefFilter: "propsCat/section/_index.md",
				propertyFilter: {
					op: "and",
					filters: [{ op: "eq", key: "Important", value: true }],
				},
			});

			const refs = refPathsOf(results);
			expect(refs).toEqual(
				expect.arrayContaining(["propsCat/section/_index.md", "propsCat/section/inner-flag.md"]),
			);
			expect(refs).not.toContain("propsCat/section/inner-plain.md");
			expect(refs).not.toContain("propsCat/alpha.md");
			expect(refs).not.toContain("propsCat/delta.md");
		});

		test("articleRefFilter + contains: limits to section's articles and filters by value", async () => {
			await setupApp();

			const results = await searchCommand.do({
				ctx: new TestContext(),
				query: "propmarker",
				catalogName: "propsCat",
				articleRefFilter: "propsCat/section/_index.md",
				propertyFilter: {
					op: "and",
					filters: [{ op: "contains", key: "Status", list: ["done"] }],
				},
			});

			const refs = refPathsOf(results);
			expect(refs).toEqual(["propsCat/section/inner-plain.md"]);
		});

		test("articleRefFilter + isEmpty: returns only section articles missing the property", async () => {
			await setupApp();

			const results = await searchCommand.do({
				ctx: new TestContext(),
				query: "propmarker",
				catalogName: "propsCat",
				articleRefFilter: "propsCat/section/_index.md",
				propertyFilter: {
					op: "and",
					filters: [{ op: "isEmpty", key: "Status" }],
				},
			});

			const refs = refPathsOf(results);
			expect(refs).toEqual(["propsCat/section/_index.md"]);
		});

		test("articleRefFilter + propertyFilter with no query returns filtered descendants", async () => {
			await setupApp();

			const results = await searchCommand.do({
				ctx: new TestContext(),
				query: undefined,
				catalogName: "propsCat",
				articleRefFilter: "propsCat/section/_index.md",
				propertyFilter: {
					op: "and",
					filters: [{ op: "eq", key: "Important", value: true }],
				},
			});

			const refs = refPathsOf(results);
			expect(refs).toEqual(
				expect.arrayContaining(["propsCat/section/_index.md", "propsCat/section/inner-flag.md"]),
			);
			expect(refs).not.toContain("propsCat/section/inner-plain.md");
			expect(refs).not.toContain("propsCat/alpha.md");
		});

		test("homepage search with propertyFilter restricted by catalogNames", async () => {
			await setupApp();

			const results = await searchCommand.do({
				ctx: new TestContext(),
				query: "propmarker",
				catalogNames: ["propsCat"],
				propertyFilter: {
					op: "and",
					filters: [{ op: "eq", key: "Important", value: true }],
				},
			});

			const articleRefs = refPathsOf(results);
			expect(articleRefs).toEqual(expect.arrayContaining(["propsCat/alpha.md", "propsCat/delta.md"]));
			expect(articleRefs).not.toContain("propsCat/beta.md");
			expect(articleRefs).not.toContain("propsCat/gamma.md");
		});
	});
});
