import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import type { AgentSkill } from "@ext/agent/core/agentResourcesProvider";
import { getAgentSkills } from "@ext/agent/prompts";
import { Command } from "../../../types/Command";

const skillsList: Command<{ ctx: Context; catalogName?: string }, { skills: AgentSkill[] }> = Command.create({
	path: "agent/skills/list",

	kind: ResponseKind.json,

	async do({ ctx, catalogName }) {
		const skills = await getAgentSkills(this._app, ctx, this._commands, catalogName);
		return {
			skills,
		};
	},

	params(ctx, q) {
		return {
			ctx,
			catalogName: q.catalogName ? String(q.catalogName) : undefined,
		};
	},
});

export default skillsList;
