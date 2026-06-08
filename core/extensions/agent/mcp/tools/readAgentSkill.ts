import { getSkillContent } from "../../prompts";
import { fail, ok, type ToolExecutionContext, type ToolExecutionResult } from "../tool";

type ReadAgentSkillInput = {
	skillName: string;
};

export async function runReadAgentSkill({ input }: ToolExecutionContext): Promise<ToolExecutionResult> {
	const { skillName: rawSkillName } = input as ReadAgentSkillInput;
	const skillName = rawSkillName.trim();
	if (!skillName) {
		return fail("Invalid input: expected { skillName: string }");
	}
	const content = getSkillContent(skillName);
	if (content == null) {
		return fail(`Unknown skill: ${skillName}`);
	}
	return ok({
		skillName,
		content,
	});
}
