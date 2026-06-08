import { AGENT_PROMPT_MAP } from "./agentPromptMap";
import { MCP_PROMPT_MAP } from "./mcpPromptMap";
import { SKILL_PROMPT_MAP } from "./skillPromptMap";

export type ToolsDescriptions = typeof MCP_PROMPT_MAP;

export function getToolsDescriptions(): ToolsDescriptions {
	return MCP_PROMPT_MAP;
}

export function getCurrentContextDescription(catalogName?: string, itemPath?: string, title?: string): string {
	if (!catalogName || !itemPath) return "";
	return `\n\n${AGENT_PROMPT_MAP.openItemPreamble}\n${JSON.stringify(
		{
			catalogName,
			itemPath,
			title: title ?? "",
		},
		null,
		2,
	)}`;
}

export function getSystemPrompt(): string {
	return AGENT_PROMPT_MAP.system;
}

export function getSkillsDescriptions(): string {
	const skillsList = Object.values(SKILL_PROMPT_MAP.skills)
		.map((skill) => `- ${skill.name}: ${skill.description}`)
		.join("\n");

	if (!skillsList) return "";
	return `\n\n${SKILL_PROMPT_MAP.skillsPreamble}\n${skillsList}`;
}

export function getSkillContent(skillName: string): string | null {
	const skill = Object.values(SKILL_PROMPT_MAP.skills).find((item) => item.name === skillName);
	return skill?.content ?? null;
}
