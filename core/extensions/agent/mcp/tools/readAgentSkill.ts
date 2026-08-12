import { getAgentSkill } from "../../prompts";
import { fail, ok, type ToolExecutionContext, type ToolExecutionResult } from "../tool";

type ReadAgentSkillInput = {
	skillName: string;
};

export async function runReadAgentSkill({
	app,
	ctx,
	commands,
	input,
	openCatalogName,
}: ToolExecutionContext): Promise<ToolExecutionResult> {
	const { skillName: rawSkillName } = input as ReadAgentSkillInput;
	const skillName = rawSkillName.trim();
	if (!skillName) {
		return fail("Invalid input: expected { skillName: string }");
	}
	if (!openCatalogName) {
		return fail("No catalog context: user needs to open a catalog before reading a skill");
	}
	const skill = await getAgentSkill(app, ctx, commands, openCatalogName, skillName);
	if (!skill) {
		return fail(`Unknown skill`);
	}
	return ok({
		skillName,
		content: skill.content,
	});
}
