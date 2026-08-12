import Path from "@core/FileProvider/Path/Path";
import type { AgentEvent } from "../core/events";
import {
	getAgentSkill,
	getCurrentContextDescription,
	getForcedSkillDescription,
	getSystemPrompt,
	getToolsDescriptions,
	getUserMessage,
} from ".";
import { AGENT_PROMPT_MAP } from "./agentPromptMap";
import { MCP_PROMPT_MAP } from "./mcpPromptMap";

const commands = {} as never;

const createApp = (skills) =>
	({
		wm: {
			current: () => ({
				getCatalog: async () => ({
					name: "docs",
					findItemByItemPath: () => ({
						ref: { path: new Path("docs/section/a.md") },
						logicPath: "docs/section/a",
						getTitle: () => "Title",
					}),
					getRepositoryRelativePath: () => new Path("section/a.md"),
					getPathname: async () => "source/-/repo/branch/docs/section/a.md",
					customProviders: {
						agentResourcesProvider: {
							getSkills: async () => skills,
							getSkillByName: async (_app, _ctx, _commands, name: string) =>
								skills.find((skill) => skill.name === name) ?? null,
							getSystemPrompt: async () => null,
						},
					},
				}),
			}),
		},
	}) as never;

describe("prompts/index", () => {
	test("getToolsDescriptions returns MCP prompt map", () => {
		expect(getToolsDescriptions()).toBe(MCP_PROMPT_MAP);
	});

	test("getCurrentContextDescription returns empty string for missing required fields", async () => {
		const app = createApp([]);
		await expect(getCurrentContextDescription(app, {} as never)).resolves.toBe("");
		await expect(getCurrentContextDescription(app, {} as never, "docs")).resolves.toBe("");
		await expect(getCurrentContextDescription(app, {} as never, "docs", "")).resolves.toBe("");
	});

	test("getCurrentContextDescription returns preamble with serialized context", async () => {
		const text = await getCurrentContextDescription(createApp([]), {} as never, "docs", "section/a.md");

		expect(text).toContain(AGENT_PROMPT_MAP.openItemPreamble);
		expect(text).toContain('"catalogName": "docs"');
		expect(text).toContain('"itemPath": "section/a.md"');
		expect(text).toContain('"title": "Title"');
		expect(text).toContain('"link": "source/-/repo/branch/docs/section/a.md"');
	});

	test("getSystemPrompt returns system text from map when catalog is missing", async () => {
		const app = {
			wm: {
				current: () => ({
					getCatalog: async () => null,
				}),
			},
		} as never;
		const text = await getSystemPrompt(app, {} as never, commands, "docs");
		expect(text).toContain(AGENT_PROMPT_MAP.system);
		expect(text).toContain(AGENT_PROMPT_MAP.formattingRules);
	});

	test("getSystemPrompt returns override from catalog provider", async () => {
		const app = {
			wm: {
				current: () => ({
					getCatalog: async () => ({
						customProviders: {
							agentResourcesProvider: {
								getSkills: async () => [],
								getSystemPrompt: async () => "custom system prompt",
							},
						},
					}),
				}),
			},
		} as never;
		const text = await getSystemPrompt(app, {} as never, commands, "docs");
		expect(text).toContain("custom system prompt");
		expect(text).toContain(AGENT_PROMPT_MAP.formattingRules);
	});

	test("getSystemPrompt joins system prompt and skills list", async () => {
		const text = await getSystemPrompt(
			createApp([{ name: "test-skill", description: "Test description", content: "" }]),
			{} as never,
			commands,
			"docs",
		);

		expect(text).toContain(AGENT_PROMPT_MAP.system);
		expect(text).toContain(AGENT_PROMPT_MAP.formattingRules);
		expect(text).toContain(AGENT_PROMPT_MAP.skillsPreamble);
		expect(text).toContain("test-skill");
	});

	test("getSystemPrompt adds browser preamble only when browser is allowed", async () => {
		const plain = await getSystemPrompt(createApp([]), {} as never, commands, "docs");
		const withBrowser = await getSystemPrompt(createApp([]), {} as never, commands, "docs", undefined, true);

		expect(plain).not.toContain(AGENT_PROMPT_MAP.browserPreamble);
		expect(withBrowser).toContain(AGENT_PROMPT_MAP.browserPreamble);
	});

	test("getAgentSkill returns existing catalog skill and null for unknown", async () => {
		const skill = { name: "test-skill", description: "Test description", content: "content" };
		const app = createApp([skill]);

		await expect(getAgentSkill(app, {} as never, commands, "docs", "test-skill")).resolves.toBe(skill);
		await expect(getAgentSkill(app, {} as never, commands, "docs", "unknown")).resolves.toBeNull();
	});

	test("getForcedSkillDescription returns forced block with full skill content", async () => {
		const text = await getForcedSkillDescription(
			createApp([{ name: "test-skill", description: "Описание", content: "Полный контент" }]),
			{} as never,
			commands,
			"docs",
			"test-skill",
		);

		expect(text).toContain(AGENT_PROMPT_MAP.forcedSkillPreamble);
		expect(text).toContain("test-skill");
		expect(text).toContain("Описание");
		expect(text).toContain("Полный контент");
	});

	test("getForcedSkillDescription returns empty string for unknown skill", async () => {
		await expect(
			getForcedSkillDescription(createApp([]), {} as never, commands, "docs", "missing-skill"),
		).resolves.toBe("");
	});

	test("getUserMessage joins open context, attachments, skill, and user text", async () => {
		const event: Extract<AgentEvent, { type: "user_message" }> = {
			type: "user_message",
			turnId: "turn-1",
			ts: 1,
			content: "Проверь файл",
			browserAllowed: true,
			openCatalogName: "docs",
			openItemPath: "section/a.md",
			useSkill: "test-skill",
			attachments: [
				{
					originalFilename: "notes.txt",
					itemPath: "sessions/sess-1/attachments/notes.txt",
					size: 18,
					mime: "text/plain",
				},
			],
		};
		const text = await getUserMessage(
			createApp([{ name: "test-skill", description: "Описание", content: "Полный контент" }]),
			{} as never,
			commands,
			event,
		);

		expect(text).toContain(AGENT_PROMPT_MAP.openItemPreamble);
		expect(text).toContain(AGENT_PROMPT_MAP.attachmentsPreamble);
		expect(text).toContain(AGENT_PROMPT_MAP.forcedSkillPreamble);
		expect(text).toContain("Проверь файл");
		expect(text).toContain("notes.txt");
	});

	test("getUserMessage returns only user text when no extras", async () => {
		const event: Extract<AgentEvent, { type: "user_message" }> = {
			type: "user_message",
			turnId: "turn-1",
			ts: 1,
			content: "hello",
		};
		await expect(getUserMessage(createApp([]), {} as never, commands, event)).resolves.toBe("hello");
	});
});
