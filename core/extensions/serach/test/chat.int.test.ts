/**
 * @jest-environment node
 */

import { createCommands } from "@app/commands";
import chat from "@app/commands/search/chat";
import getApp from "@app/node/app";
import TestContext from "@app/test/TestContext";
import type Application from "@app/types/Application";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import Permission from "@ext/security/logic/Permission/Permission";
import StrictPermissionMap from "@ext/security/logic/PermissionMap/StrictPermissionMap";
import User from "@ext/security/logic/User/User";
import { resolve } from "path";

const mockChat = jest.fn().mockResolvedValue({ requestId: 1 });

jest.mock("@ics/gx-vector-search", () => {
	return {
		RagApiClient: jest.fn().mockImplementation(() => ({
			chat: mockChat,
			checkServer: jest.fn().mockResolvedValue({ ok: true }),
			checkAuth: jest.fn().mockResolvedValue({ ok: true }),
			updateArticles: jest.fn().mockResolvedValue({ done: true }),
			plugins: jest.fn().mockResolvedValue([{ name: "@ics/modulith-rag", version: "0.0.8" }]),
		})),
	};
});

type ChatCommandArgs = ReturnType<(typeof chat)["params"]>;

const defaultArgs: Pick<ReturnType<(typeof chat)["params"]>, "currentArticle" | "query"> = {
	currentArticle: new Path(),
	query: "ignored",
};

const defaultPerms = {
	docsA: ["ReadCatalogContent"],
	docsB: ["ReadCatalogContent"],
	mixed: ["ReadCatalogContent"],
	propsCat: ["ReadCatalogContent"],
};

const allPerms = {
	...defaultPerms,
	secret: ["ReadCatalogContent"],
};

const commandArgs = (perms: "default" | "all" = "default"): ChatCommandArgs => {
	const userPerms = perms === "default" ? defaultPerms : allPerms;
	return {
		...defaultArgs,
		ctx: new TestContext({ user: new RoleUser(userPerms) }),
	};
};

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
	hidden?: boolean;
	private?: string;
	properties?: string;
}

const article = (args: ArticleArgs) => {
	return `---
title: ${args.title}
${args.hidden ? "hidden: true" : ""}
${args.private ? `private: ${args.private}` : ""}
${
	args.properties
		? `properties:
${args.properties}`
		: ""
}
---

body`;
};

const catalogRoot = (title: string, extra = "") => `title: ${title}\nurl: ${title}\n${extra}\n`;

process.env.ROOT_PATH = resolve(__dirname, "search_tests");
process.env.AI_SERVER_URL = "ignored";
process.env.AI_TOKEN = "ignored";
process.env.AI_INSTANCE_NAME = "ignored";

const p = (s: string) => new Path(s);
const dfp = new DiskFileProvider(p(process.env.ROOT_PATH));

const setupApp = async (): Promise<Application> => {
	delete global.app;
	delete global.commands;
	delete global.config;
	const app = await getApp();
	createCommands(app);
	return app;
};

describe("search/chat", () => {
	beforeAll(async () => {
		await dfp.delete(p("."));

		await dfp.write(p("docsA/.doc-root.yaml"), catalogRoot("docsA"));
		await dfp.write(p("docsA/alpha.md"), article({ title: "Alpha Title" }));
		await dfp.write(p("docsA/sharedWord.md"), article({ title: "Shared Title A" }));
		await dfp.write(p("docsA/section/_index.md"), article({ title: "Alpha Section" }));
		await dfp.write(p("docsA/section/inner.md"), article({ title: "Inner Article" }));
		await dfp.write(p("docsA/section/inner2.md"), article({ title: "Inner 2 Article" }));
		await dfp.write(p("docsA/section/inner3.md"), article({ title: "Inner 3 Article", hidden: true }));
		await dfp.write(p("docsA/hiddenSection/_index.md"), article({ title: "Inner 3 Article", hidden: true }));
		await dfp.write(p("docsA/hiddenSection/inner.md"), article({ title: "Inner 3 Article" }));
		await dfp.write(p("docsA/hiddenSection/inner2.md"), article({ title: "Inner 3 Article" }));
		await dfp.write(p("docsA/outside.md"), article({ title: "Outside Article" }));

		await dfp.write(p("docsB/.doc-root.yaml"), catalogRoot("docsB"));
		await dfp.write(p("docsB/beta.md"), article({ title: "Beta Title" }));
		await dfp.write(p("docsB/sharedWord.md"), article({ title: "Shared Title B" }));
		await dfp.write(p("docsB/section/_index.md"), article({ title: "B Section" }));
		await dfp.write(p("docsB/section/inner.md"), article({ title: "B Section Inner 1" }));
		await dfp.write(p("docsB/section/inner2.md"), article({ title: "B Section Inner 2" }));
		await dfp.write(p("docsB/section/innerSection/inner.md"), article({ title: "B Section Inner Inner" }));

		await dfp.write(p("secret/.doc-root.yaml"), catalogRoot("secret", "private: true"));
		await dfp.write(p("secret/secret-article.md"), article({ title: "Secret Title" }));

		await dfp.write(p("mixed/.doc-root.yaml"), catalogRoot("mixed"));
		await dfp.write(p("mixed/public-article.md"), article({ title: "Mixed Public" }));
		await dfp.write(p("mixed/restricted-article.md"), article({ title: "Mixed Restricted", hidden: true }));
	});

	afterAll(async () => {
		await dfp.delete(p("."));
		delete global.app;
		delete global.commands;
		delete global.config;
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	// {
	// 	ctx: Context;
	// 	query: string;
	// 	signal: AbortSignal;
	// 	catalogName?: string;
	// 	articlesLanguage?: ArticleLanguage;
	// 	responseLanguage?: ContentLanguage;
	// 	articleRefFilter?: string;
	// 	currentArticle: Path;
	// 	catalogNames?: string[];
	// }

	test("filtered by accessible catalogs and restricted articles", async () => {
		await setupApp();

		await chat.do({ ...commandArgs() });

		expect(mockChat).toHaveBeenCalledTimes(1);
		const actualArgs = mockChat.mock.calls[0][0];
		expect(actualArgs.filter).toEqual({
			metadata: {
				filters: [
					{
						key: "catalogId",
						list: expect.arrayContaining(["mixed", "docsA", "docsB"]),
						op: "in",
					},
					{
						filter: {
							key: "refPath",
							list: expect.arrayContaining([
								"mixed/restricted-article.md",
								"docsA/section/inner3.md",
								"docsA/hiddenSection/_index.md",
								"docsA/hiddenSection/inner.md",
								"docsA/hiddenSection/inner2.md",
							]),
							op: "in",
						},
						op: "not",
					},
				],
				op: "and",
			},
		});
		expect(actualArgs.filter.metadata.filters[0].list).toHaveLength(3);
		expect(actualArgs.filter.metadata.filters[1].filter.list).toHaveLength(5);
		expect(actualArgs.language).toBe(undefined);
	});

	test("filtered by catalog", async () => {
		await setupApp();

		await chat.do({
			...commandArgs(),
			catalogName: "docsB",
		});

		expect(mockChat).toHaveBeenCalledTimes(1);
		const actualArgs = mockChat.mock.calls[0][0];
		expect(actualArgs.filter).toEqual({
			metadata: {
				filters: [
					{
						key: "catalogId",
						list: ["docsB"],
						op: "in",
					},
				],
				op: "and",
			},
		});
		expect(actualArgs.language).toBe(undefined);
	});

	test("restricted article in catalog", async () => {
		await setupApp();

		await chat.do({
			...commandArgs(),
			catalogName: "mixed",
		});

		expect(mockChat).toHaveBeenCalledTimes(1);
		const actualArgs = mockChat.mock.calls[0][0];
		expect(actualArgs.filter).toEqual({
			metadata: {
				filters: [
					{
						key: "catalogId",
						list: ["mixed"],
						op: "in",
					},
					{
						filter: {
							key: "refPath",
							list: ["mixed/restricted-article.md"],
							op: "in",
						},
						op: "not",
					},
				],
				op: "and",
			},
		});
		expect(actualArgs.language).toBe(undefined);
	});

	test("filtered by descendant articles of articleRefFilter: section", async () => {
		await setupApp();

		await chat.do({
			...commandArgs(),
			catalogName: "docsB",
			articleRefFilter: "docsB/section/_index.md",
		});

		expect(mockChat).toHaveBeenCalledTimes(1);
		const actualArgs = mockChat.mock.calls[0][0];
		expect(actualArgs.filter).toEqual({
			metadata: {
				filters: [
					{
						key: "refPath",
						list: [
							"docsB/section/_index.md",
							"docsB/section/inner.md",
							"docsB/section/inner2.md",
							"docsB/section/innerSection/inner.md",
						],
						op: "in",
					},
				],
				op: "and",
			},
		});
		expect(actualArgs.filter.metadata.filters[0].list).toHaveLength(4);
		expect(actualArgs.language).toBe(undefined);
	});

	test("filtered by descendant articles of articleRefFilter: article", async () => {
		await setupApp();

		await chat.do({
			...commandArgs(),
			catalogName: "docsB",
			articleRefFilter: "docsB/section/inner.md",
		});

		expect(mockChat).toHaveBeenCalledTimes(1);
		const actualArgs = mockChat.mock.calls[0][0];
		expect(actualArgs.filter).toEqual({
			metadata: {
				filters: [
					{
						key: "refPath",
						list: ["docsB/section/inner.md"],
						op: "in",
					},
				],
				op: "and",
			},
		});
		expect(actualArgs.language).toBe(undefined);
	});

	test("filtered by descendant articles of articleRefFilter: restricted", async () => {
		await setupApp();

		await chat.do({
			...commandArgs(),
			catalogName: "docsA",
			articleRefFilter: "docsA/section/inner3.md",
		});

		expect(mockChat).toHaveBeenCalledTimes(1);
		const actualArgs = mockChat.mock.calls[0][0];
		expect(actualArgs.filter).toEqual({
			metadata: {
				filters: [
					{
						key: "refPath",
						list: [],
						op: "in",
					},
				],
				op: "and",
			},
		});
		expect(actualArgs.language).toBe(undefined);
	});

	test("filtered by descendant articles of articleRefFilter: one of articles restricted", async () => {
		await setupApp();

		await chat.do({
			...commandArgs(),
			catalogName: "docsA",
			articleRefFilter: "docsA/section/_index.md",
		});

		expect(mockChat).toHaveBeenCalledTimes(1);
		const actualArgs = mockChat.mock.calls[0][0];
		expect(actualArgs.filter).toEqual({
			metadata: {
				filters: [
					{
						key: "refPath",
						list: ["docsA/section/_index.md", "docsA/section/inner.md", "docsA/section/inner2.md"],
						op: "in",
					},
				],
				op: "and",
			},
		});
		expect(actualArgs.language).toBe(undefined);
	});

	test("filtered by descendant articles of articleRefFilter: section restricted", async () => {
		await setupApp();

		await chat.do({
			...commandArgs(),
			catalogName: "docsA",
			articleRefFilter: "docsA/hiddenSection/_index.md",
		});

		expect(mockChat).toHaveBeenCalledTimes(1);
		const actualArgs = mockChat.mock.calls[0][0];
		expect(actualArgs.filter).toEqual({
			metadata: {
				filters: [
					{
						key: "refPath",
						list: [],
						op: "in",
					},
				],
				op: "and",
			},
		});
		expect(actualArgs.language).toBe(undefined);
	});

	test("filtered by descendant articles of articleRefFilter: invalid article", async () => {
		await setupApp();

		await chat.do({
			...commandArgs(),
			catalogName: "docsA",
			articleRefFilter: "docsA/invalidSection/inner3.md",
		});

		expect(mockChat).toHaveBeenCalledTimes(1);
		const actualArgs = mockChat.mock.calls[0][0];
		expect(actualArgs.filter).toEqual({
			metadata: {
				filters: [
					{
						key: "refPath",
						list: [],
						op: "in",
					},
				],
				op: "and",
			},
		});
		expect(actualArgs.language).toBe(undefined);
	});

	test("catalog is restricted", async () => {
		await setupApp();

		await chat.do({
			...commandArgs(),
			catalogName: "secret",
		});

		expect(mockChat).toHaveBeenCalledTimes(1);
		const actualArgs = mockChat.mock.calls[0][0];
		expect(actualArgs.filter).toEqual({
			metadata: {
				filters: [
					{
						key: "catalogId",
						list: [],
						op: "in",
					},
				],
				op: "and",
			},
		});
		expect(actualArgs.language).toBe(undefined);
	});

	test("user have access to private catalog", async () => {
		await setupApp();

		await chat.do({
			...commandArgs("all"),
			catalogName: "secret",
		});

		expect(mockChat).toHaveBeenCalledTimes(1);
		const actualArgs = mockChat.mock.calls[0][0];
		expect(actualArgs.filter).toEqual({
			metadata: {
				filters: [
					{
						key: "catalogId",
						list: ["secret"],
						op: "in",
					},
				],
				op: "and",
			},
		});
		expect(actualArgs.language).toBe(undefined);
	});

	test("catalog with restricted article", async () => {
		await setupApp();

		await chat.do({
			...commandArgs("all"),
			catalogName: "mixed",
		});

		expect(mockChat).toHaveBeenCalledTimes(1);
		const actualArgs = mockChat.mock.calls[0][0];
		expect(actualArgs.filter).toEqual({
			metadata: {
				filters: [
					{
						key: "catalogId",
						list: ["mixed"],
						op: "in",
					},
					{
						filter: {
							key: "refPath",
							list: ["mixed/restricted-article.md"],
							op: "in",
						},
						op: "not",
					},
				],
				op: "and",
			},
		});
		expect(actualArgs.language).toBe(undefined);
	});
});
