import { getExecutingEnvironment } from "@app/resolveModule/env";
import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import { relocateToUrl } from "@ext/enterprise/components/SingInOut/hooks/useSignIn";
import { Command } from "../../types/Command";

const switchOrganization: Command<{ ctx: Context; apiUrl: string; redirectUrl: string }, void> = Command.create({
	path: "enterpriseCloud/switchOrganization",

	kind: ResponseKind.none,

	async do({ ctx, apiUrl, redirectUrl }) {
		const workspace = this._app.wm.current();
		await this._commands.workspace.remove.do({ ctx, id: workspace.path() });

		if (getExecutingEnvironment() === "tauri")
			await this._commands.enterpriseCloud.setGesCloudUrl.do({ gesCloudUrl: apiUrl });

		if (getExecutingEnvironment() === "web") relocateToUrl(redirectUrl);
	},

	params(ctx, q) {
		return { ctx, apiUrl: q.apiUrl, redirectUrl: q.redirectUrl };
	},
});

export default switchOrganization;
