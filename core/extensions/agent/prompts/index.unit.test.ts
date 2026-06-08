import {
	getCurrentContextDescription,
	getSkillContent,
	getSkillsDescriptions,
	getSystemPrompt,
	getToolsDescriptions,
} from ".";
import { AGENT_PROMPT_MAP } from "./agentPromptMap";
import { MCP_PROMPT_MAP } from "./mcpPromptMap";
import { SKILL_PROMPT_MAP } from "./skillPromptMap";

describe("prompts/index", () => {
	test("getToolsDescriptions returns MCP prompt map", () => {
		expect(getToolsDescriptions()).toBe(MCP_PROMPT_MAP);
	});

	test("getCurrentContextDescription returns empty string for missing required fields", () => {
		expect(getCurrentContextDescription()).toBe("");
		expect(getCurrentContextDescription("docs")).toBe("");
		expect(getCurrentContextDescription("docs", "")).toBe("");
	});

	test("getCurrentContextDescription returns preamble with serialized context", () => {
		const text = getCurrentContextDescription("docs", "section/a.md", "Title");

		expect(text).toContain(AGENT_PROMPT_MAP.openItemPreamble);
		expect(text).toContain('"catalogName": "docs"');
		expect(text).toContain('"itemPath": "section/a.md"');
		expect(text).toContain('"title": "Title"');
	});

	test("getSystemPrompt returns system text from map", () => {
		expect(getSystemPrompt()).toBe(AGENT_PROMPT_MAP.system);
	});

	test("getSkillsDescriptions returns preamble and skills list", () => {
		const skills = getSkillsDescriptions();
		const knownSkill = Object.values(SKILL_PROMPT_MAP.skills)[0];

		expect(skills).toContain(SKILL_PROMPT_MAP.skillsPreamble);
		expect(skills).toContain(`- ${knownSkill.name}: ${knownSkill.description}`);
	});

	test("getSkillContent returns content for existing skill and null for unknown", () => {
		const knownSkill = Object.values(SKILL_PROMPT_MAP.skills)[0];
		expect(knownSkill).toBeDefined();
		expect(getSkillContent(knownSkill.name)).toBe(knownSkill.content);
		expect(getSkillContent("unknown")).toBeNull();
	});
});
