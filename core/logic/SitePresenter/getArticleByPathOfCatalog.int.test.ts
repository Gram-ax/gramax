import TestContext from "@app/test/TestContext";
import type Application from "@app/types/Application";
import getApp from "@app/web/app";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import type { EditArticlePageData } from "@core/SitePresenter/types/ArticlePage";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { resolve } from "path";
import getWebFetchService from "../../../apps/web/src/logic/Api/getWebFetchService";

process.env.ROOT_PATH = resolve(__dirname, "getArticleByPathOfCatalog_tests");
const p = (s: string) => new Path(s);
const dfp = new DiskFileProvider(p(process.env.ROOT_PATH));

const catalogRoot = (title: string) => `title: ${title}\nurl: ${title}\n`;
const article = (title: string, body = "body") => `---\ntitle: ${title}\n---\n\n${body}`;

let app: Application;

describe("getArticleByPathOfCatalog", () => {
	beforeAll(async () => {
		await dfp.delete(p("."));
		await dfp.write(p("notes/.doc-root.yaml"), catalogRoot("notes"));
		await dfp.write(p("notes/keep.md"), article("Keep"));
		delete global.app;
		delete global.commands;
		delete global.config;
		app = await getApp();
	});

	afterAll(async () => {
		await dfp.delete(p("."));
		delete global.app;
		delete global.commands;
		delete global.config;
	});

	test("resolves by logic path", async () => {
		const sp = app.sitePresenterFactory.fromContext(new TestContext());
		const { article } = await sp.getArticleByPathOfCatalog(["notes", "keep"]);
		expect(article?.logicPath).toBe("notes/keep");
	});

	test("resolves by item file path (ref.path with .md), as sent by ArticleUpdaterService", async () => {
		const sp = app.sitePresenterFactory.fromContext(new TestContext());
		const { article } = await sp.getArticleByPathOfCatalog(["notes", "keep.md"]);
		expect(article?.logicPath).toBe("notes/keep");
	});

	// Full transport path of ArticleUpdaterService.update: URL → command dispatch → respond().
	// Guards the ResponseKind regression — without kind: json the command runs but the
	// response body stays empty and the updater silently no-ops.
	test("page/getArticlePageData over fetch returns a body with data.content", async () => {
		const fetchSelf = getWebFetchService(() => "/");
		const url = new ApiUrlCreator("", "notes", "notes/keep.md").getArticlePageData();
		const res = await fetchSelf(url);
		expect(res.ok).toBe(true);
		const body = (await res.json?.()) as { data?: EditArticlePageData } | null;
		// Test env serves the readonly page (content is a render tree, not a string) —
		// the regression this guards is an entirely empty body, so assert presence.
		expect(body?.data?.content).toBeDefined();
		expect(body.data.articleProps.logicPath).toBe("notes/keep");
	});
});
