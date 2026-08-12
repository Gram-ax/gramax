import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import { Command } from "../../../types/Command";

const healthcheck: Command<{ ctx: Context; sourceName: string }, { isHealthy: boolean }> = Command.create({
	path: "storage/sourceData/healthcheck",

	kind: ResponseKind.json,

	async do({ ctx, sourceName }) {
		const data = this._app.rp.getSourceData(ctx, sourceName);
		if (!data) return { isHealthy: true };

		const sourceApi = makeSourceApi(data);
		if (!sourceApi) return { isHealthy: true };

		const isHealthy = await Promise.race<boolean>([
			sourceApi.healthcheck().catch(() => false),
			new Promise((resolve) => setTimeout(() => resolve(false), 5000)),
		]);
		return { isHealthy };
	},

	params(ctx, q) {
		return { ctx, sourceName: q.sourceName };
	},
});

export default healthcheck;
