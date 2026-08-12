import { createCommands } from "@app/commands";
import searchCommand from "@app/commands/search/searchCommand";
import TestContext from "@app/test/TestContext";
import type Application from "@app/types/Application";
import getApp from "@app/web/app";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import { Document, HeadingLevel, Packer, Paragraph } from "docx";
import { resolve } from "path";

process.env.ROOT_PATH = resolve(__dirname, "search_resource_tests");
const p = (s: string) => new Path(s);
const dfp = new DiskFileProvider(p(process.env.ROOT_PATH));

const article = (title: string, body: string) => `---\ntitle: ${title}\n---\n\n${body}`;
const catalogRoot = (title: string) => `title: ${title}\nurl: ${title}\n`;

const docx = async ({ heading, body }: { heading?: string; body: string }): Promise<Buffer> => {
	const children = [];
	if (heading) children.push(new Paragraph({ text: heading, heading: HeadingLevel.HEADING_1 }));
	children.push(new Paragraph(body));
	return await Packer.toBuffer(new Document({ sections: [{ children }] }));
};

const t = (text: string) => ({ type: "text", text });
const h = (text: string) => ({ type: "highlight", text });

const reindex = (app: Application) => app.searcherManager.getSearcher().updateIndex({ force: true });

const setupApp = async (): Promise<Application> => {
	delete global.app;
	delete global.commands;
	delete global.config;
	const app = await getApp();
	createCommands(app);
	// Resource indexing is gated on an enterprise workspace; flip the in-memory config so
	// the (plain) test workspace indexes resources without spinning up an EnterpriseWorkspace.
	const cfg = (await app.wm.current().config()) as { enterprise?: { gesUrl?: string } };
	cfg.enterprise = { ...cfg.enterprise, gesUrl: "http://test-ges" };
	await reindex(app);
	return app;
};

const search = (query: string, catalogName?: string) =>
	searchCommand.do({ ctx: new TestContext(), query, catalogName });

const refPathsOf = (results: Awaited<ReturnType<typeof searchCommand.do>>) =>
	results.filter((r) => r.type === "article").map((r) => r.refPath);

describe("searchCommand resources", () => {
	beforeAll(async () => {
		await dfp.delete(p("."));
		await dfp.write(p("docsA/.doc-root.yaml"), catalogRoot("docsA"));
	});

	afterAll(async () => {
		await dfp.delete(p("."));
		delete global.app;
		delete global.commands;
		delete global.config;
	});

	test("resource body text is searchable and surfaces the linking article", async () => {
		await dfp.write(p("docsA/body.md"), article("Body Host", "attached [report](body.docx) file"));
		await dfp.write(p("docsA/body.docx"), await docx({ heading: "Quarterly Heading", body: "revenuemarker grew" }));

		await setupApp();
		const results = await search("revenuemarker", "docsA");

		expect(results).toEqual([
			{
				type: "article",
				refPath: "docsA/body.md",
				isRecommended: false,
				catalog: { name: "docsA", title: "docsA", url: "/docsA" },
				title: [t("Body Host")],
				url: "/docsA/body",
				breadcrumbs: [],
				properties: [],
				items: [
					{
						type: "block",
						order: 2,
						title: [t("report")],
						embeddedLinkTitle: [t("body.docx")],
						score: expect.any(Number),
						items: [
							{
								type: "block",
								order: 1,
								title: [t("Quarterly Heading")],
								score: expect.any(Number),
								items: [
									{
										type: "paragraph",
										order: 1,
										items: [h("revenuemarker"), t(" grew")],
										score: expect.any(Number),
										searchText: "revenuemarker grew",
									},
								],
							},
						],
					},
				],
			},
		]);
	});

	test("resource heading text is searchable", async () => {
		await dfp.write(p("docsA/heading.md"), article("Heading Host", "see [spec](heading.docx)"));
		await dfp.write(
			p("docsA/heading.docx"),
			await docx({ heading: "architecturemarker overview", body: "plain body" }),
		);

		await setupApp();
		const results = await search("architecturemarker", "docsA");

		expect(results).toEqual([
			{
				type: "article",
				refPath: "docsA/heading.md",
				isRecommended: false,
				catalog: { name: "docsA", title: "docsA", url: "/docsA" },
				title: [t("Heading Host")],
				url: "/docsA/heading",
				breadcrumbs: [],
				properties: [],
				items: [
					{
						type: "block",
						order: 2,
						title: [t("spec")],
						embeddedLinkTitle: [t("heading.docx")],
						score: expect.any(Number),
						items: [
							{
								type: "block",
								order: 1,
								title: [h("architecturemarker"), t(" overview")],
								score: expect.any(Number),
								items: [],
							},
						],
					},
				],
			},
		]);
	});

	test("resource is reindexed when its content changes", async () => {
		await dfp.write(p("docsA/changing.md"), article("Changing Host", "[doc](changing.docx)"));
		await dfp.write(p("docsA/changing.docx"), await docx({ body: "firstmarker content" }));

		const app = await setupApp();
		expect(refPathsOf(await search("firstmarker", "docsA"))).toEqual(["docsA/changing.md"]);

		await dfp.write(p("docsA/changing.docx"), await docx({ body: "secondmarker content" }));
		await reindex(app);

		expect(refPathsOf(await search("firstmarker", "docsA"))).toEqual([]);
		expect(refPathsOf(await search("secondmarker", "docsA"))).toEqual(["docsA/changing.md"]);
	});

	test("resource is removed from index when its file is deleted, article itself remains", async () => {
		await dfp.write(p("docsA/dropping.md"), article("Dropping Host", "ownbodymarker [doc](dropping.docx)"));
		await dfp.write(p("docsA/dropping.docx"), await docx({ body: "resourcemarker content" }));

		const app = await setupApp();
		expect(refPathsOf(await search("resourcemarker", "docsA"))).toEqual(["docsA/dropping.md"]);

		await dfp.delete(p("docsA/dropping.docx"));
		await reindex(app);

		expect(refPathsOf(await search("resourcemarker", "docsA"))).toEqual([]);
		expect(refPathsOf(await search("ownbodymarker", "docsA"))).toEqual(["docsA/dropping.md"]);
	});

	test("resource is searchable from homepage search without a catalog scope", async () => {
		await dfp.write(p("docsA/home.md"), article("Home Host", "[doc](home.docx)"));
		await dfp.write(p("docsA/home.docx"), await docx({ body: "homemarker content" }));

		await setupApp();
		expect(refPathsOf(await search("homemarker"))).toEqual(["docsA/home.md"]);
	});
});
