import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Context from "@core/Context/Context";
import DefaultGramaxAi from "@ext/ai/logic/GramaxAi";
import assert from "assert";
import { Command } from "../../../types/Command";

const transcribe: Command<{ ctx: Context; catalogName: string; blob: Blob }, string> = Command.create({
	path: "ai/audio/transcribe",

	kind: ResponseKind.plain,

	middlewares: [new AuthorizeMiddleware()],

	async do({ ctx, blob, catalogName }) {
		const { wm } = this._app;
		const workspace = wm.current();
		const catalog = await workspace.getCatalog(catalogName, ctx);

		assert(catalog, "Catalog is not found");
		const data = await this._commands.ai.server.getAiData.do({ ctx, workspacePath: workspace.path() });

		assert(data.token, "AI Server token is required");
		assert(data.apiUrl, "AI Server API URL is required");

		const aiProvider = new DefaultGramaxAi({
			apiUrl: data.apiUrl,
			token: data.token,
			meta: { instanceName: data.instanceName },
		});

		const arrayBuffer = await blob.arrayBuffer();
		const webmFile = new File([arrayBuffer], "audio_recording.webm", { type: "audio/webm" });

		const res = await aiProvider.transcribe({ audio: webmFile });
		return res.text;
	},

	params(ctx, q, body) {
		const blob = body as Blob;
		const catalogName = q.catalogName;
		return { ctx, blob, catalogName };
	},
});

export default transcribe;
