import type Context from "@core/Context/Context";
import type Cookie from "@ext/cookie/Cookie";
import WorkspaceManager from "@ext/workspace/WorkspaceManager";
import { Encoder } from "@ext/Encoder/Encoder";
import { AiServerConfig } from "../models/types";

export class AiDataProvider {
	protected secret = "rJej4ekU2j";

	private _encoder: Encoder;
	private _postfix = "_ai_data";

	constructor(private _wm: WorkspaceManager, private _cookie?: Cookie) {
		this._encoder = new Encoder();
	}

	getEditorAiData(ctx: Context, workspacePath: string): AiServerConfig {
		if (!this._wm.hasWorkspace()) return { apiUrl: "", token: "" };

		const name = this._getCompleteName(workspacePath);
		if (!ctx.cookie.exist(name)) return { apiUrl: "", token: "" };
		return this._decode(ctx.cookie.get(name));
	}

	removeEditorAiData(ctx: Context, workspacePath: string) {
		const name = this._getCompleteName(workspacePath);
		if (ctx.cookie.exist(name)) ctx.cookie.remove(name);
	}

	setEditorAiData(ctx: Context, workspacePath: string, data: AiServerConfig) {
		const encoded = this._encode(data);
		ctx.cookie.set(this._getCompleteName(workspacePath), encoded);
	}

	private _encode(data: AiServerConfig) {
		return this._encoder.ecode([JSON.stringify(data)], this.secret);
	}

	private _decode(ticket: string): AiServerConfig {
		const data = this._encoder.decode(this.secret, ticket);
		try {
			return JSON.parse(data[0]);
		} catch (e) {
			throw new Error("Encoded data is malformed, can't decode: " + e.message);
		}
	}

	private _getCompleteName(workspacePath: string) {
		return `${this._postfix}_${encodeURIComponent(workspacePath)}`;
	}
}
