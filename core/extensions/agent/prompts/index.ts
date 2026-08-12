import type { CommandTree } from "@app/commands";
import type Application from "@app/types/Application";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import type { AgentSkill } from "../core/agentResourcesProvider";
import type { AgentAttachment } from "../core/attachmentStore";
import type { AgentEvent } from "../core/events";
import { CatalogItemLookup } from "../mcp/utils/catalogPaths";
import { AGENT_PROMPT_MAP } from "./agentPromptMap";
import { MCP_PROMPT_MAP } from "./mcpPromptMap";

export type ToolsDescriptions = typeof MCP_PROMPT_MAP;

export function getToolsDescriptions(): ToolsDescriptions {
	return MCP_PROMPT_MAP;
}

export async function getCurrentContextDescription(
	app: Application,
	ctx: Context,
	catalogName?: string,
	itemPath?: string,
): Promise<string> {
	if (!catalogName || !itemPath) return "";
	const catalog = await app.wm.current().getCatalog(catalogName, ctx);
	const item = catalog.findItemByItemPath(new Path(Path.join(catalogName, itemPath)));
	if (!item) return "";
	const resolved = (await CatalogItemLookup.fromCatalogItem(catalog, item)).asJSON();
	return `${AGENT_PROMPT_MAP.openItemPreamble}\n${JSON.stringify(resolved, null, 2)}`;
}

export async function getSystemPrompt(
	app: Application,
	ctx: Context,
	commands: CommandTree,
	catalogName?: string,
	skills?: AgentSkill[],
	browserAllowed?: boolean,
): Promise<string> {
	let systemText: string = AGENT_PROMPT_MAP.system;

	if (catalogName) {
		const catalogObj = await app.wm.current().getCatalog(catalogName, ctx);
		if (catalogObj) {
			const promptOverride = await catalogObj.customProviders.agentResourcesProvider.getSystemPrompt();
			systemText = promptOverride ?? AGENT_PROMPT_MAP.system;
		}
	}

	const skillsDescription = await getAgentSkillsDescriptions(app, ctx, commands, catalogName, skills);
	return [
		systemText,
		browserAllowed ? AGENT_PROMPT_MAP.browserPreamble : "",
		AGENT_PROMPT_MAP.formattingRules,
		skillsDescription,
	]
		.filter(Boolean)
		.join("\n\n");
}

export function getAttachmentsDescription(attachments: AgentAttachment[] = []): string {
	if (!attachments.length) {
		return "";
	}

	const attachmentItems = attachments.map((attachment) => ({
		attachmentName: attachment.originalFilename,
	}));

	return `${AGENT_PROMPT_MAP.attachmentsPreamble}\n${JSON.stringify(attachmentItems, null, 2)}`;
}

export async function getAgentSkills(
	app: Application,
	ctx: Context,
	commands: CommandTree,
	catalogName?: string,
): Promise<AgentSkill[]> {
	if (!catalogName) return [];

	const catalog = await app.wm.current().getCatalog(catalogName, ctx);
	if (!catalog) return [];

	return catalog.customProviders.agentResourcesProvider.getSkills(app, ctx, commands);
}

export async function getAgentSkill(
	app: Application,
	ctx: Context,
	commands: CommandTree,
	catalogName: string,
	skillName: string,
): Promise<AgentSkill | null> {
	const catalog = await app.wm.current().getCatalog(catalogName, ctx);
	if (!catalog) return null;

	return catalog.customProviders.agentResourcesProvider.getSkillByName(app, ctx, commands, skillName);
}

export async function getAgentSkillsDescriptions(
	app: Application,
	ctx: Context,
	commands: CommandTree,
	catalogName?: string,
	skills?: AgentSkill[],
): Promise<string> {
	const list = skills ?? (await getAgentSkills(app, ctx, commands, catalogName));
	const skillsList = list.map((skill) => `- ${skill.name}: ${skill.description}`).join("\n");

	if (!skillsList) return "";
	return `${AGENT_PROMPT_MAP.skillsPreamble}\n${skillsList}`;
}

export async function getForcedSkillDescription(
	app: Application,
	ctx: Context,
	commands: CommandTree,
	catalogName?: string,
	useSkill?: string,
	skills?: AgentSkill[],
): Promise<string> {
	if (!useSkill || !catalogName) return "";
	const skill = skills
		? (skills.find((item) => item.name === useSkill) ?? null)
		: await getAgentSkill(app, ctx, commands, catalogName, useSkill);
	if (!skill) {
		console.warn(`getForcedSkillDescription: unknown skill "${useSkill}" in catalog "${catalogName}"`);
		return "";
	}

	return `${AGENT_PROMPT_MAP.forcedSkillPreamble}\n- ${skill.name}: ${skill.description}\n\n${skill.content}`;
}

export async function getUserMessage(
	app: Application,
	ctx: Context,
	commands: CommandTree,
	event: Extract<AgentEvent, { type: "user_message" }>,
	skills?: AgentSkill[],
): Promise<string> {
	const currentContextDescription = await getCurrentContextDescription(
		app,
		ctx,
		event.openCatalogName,
		event.openItemPath,
	);
	const forcedSkillDescription = await getForcedSkillDescription(
		app,
		ctx,
		commands,
		event.openCatalogName,
		event.useSkill,
		skills,
	);
	const attachmentsDescription = getAttachmentsDescription(event.attachments ?? []);
	return [currentContextDescription, forcedSkillDescription, attachmentsDescription, event.content]
		.filter(Boolean)
		.join("\n\n");
}
