import type Context from "@core/Context/Context";
import type Cookie from "@ext/cookie/Cookie";
import t from "@ext/localization/locale/translate";
import SourceDataCtx, { type ProxiedSourceDataCtx } from "@ext/storage/logic/SourceDataProvider/logic/SourceDataCtx";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import WorkspaceManager from "@ext/workspace/WorkspaceManager";
import assert from "assert";
import { Encoder } from "../../../../Encoder/Encoder";
import SourceData from "../model/SourceData";

export class SourceDataProvider {
	protected secret = "UGnL8QMQqw";

	private _encoder: Encoder;
	private _postfix = "_storage_data";

	constructor(private _wm: WorkspaceManager, private _cookie?: Cookie, private _authServiceUrl?: string) {
		this._encoder = new Encoder();
	}

	withContext(ctx: Context): SourceDataProvider {
		return new SourceDataProvider(this._wm, ctx.cookie, this._authServiceUrl);
	}

	getSourceDatas(): SourceData[] {
		if (!this._wm.hasWorkspace()) return [];

		const sourceTypes = new Set(Object.values(SourceType));
		const postfixes = [this._getPostfix(null, false), this._getPostfix(null, true)];

		const uniqNames = new Set<string>();
		const allCookieNames = this._cookie.getAllNames();

		for (const postfix of postfixes) {
			for (const name of allCookieNames) {
				if (!name.endsWith(postfix)) continue;
				uniqNames.add(name.slice(0, -postfix.length));
			}
		}

		return Array.from(uniqNames)
			.map((n) => this.getSourceByName(n).raw)
			.filter((d): d is SourceData => !!d && sourceTypes.has(d.sourceType));
	}

	isSourceExists(storageName: string, workspaceId?: WorkspacePath): boolean {
		return (
			this._cookie.exist(this._getCompleteName(storageName, workspaceId)) ||
			this._cookie.exist(this._getCompleteName(storageName, workspaceId, false))
		);
	}

	removeSource(storageName: string): void {
		const name = this._getCompleteName(storageName, null);
		if (this._cookie.exist(name)) this._cookie.remove(name);
	}

	getSourceByName(storageName: string, workspaceId?: WorkspacePath): ProxiedSourceDataCtx<SourceData> {
		const data =
			this._cookie.get(this._getCompleteName(storageName, workspaceId)) ||
			this._cookie.get(this._getCompleteName(storageName, workspaceId, false));

		if (!data) throw new Error(t("git.source.error.storage-not-exist").replace("{{storage}}", storageName));
		const sourceData = this._decode(data);
		assert(sourceData, "invalid source data; expected a value");
		return SourceDataCtx.init(sourceData, this._authServiceUrl, (sourceData, isValid) => {
			sourceData.isInvalid = !isValid;
			this.updateSource(sourceData, workspaceId);
		});
	}

	updateSource(data: SourceData, workspaceId?: string): string {
		this._normalizeSourceData(data);
		const storageName = getStorageNameByData(data);
		const raw = "raw" in data ? (data.raw as SourceData) : data;
		if (!raw.isInvalid) delete raw.isInvalid;
		this._cookie.set(this._getCompleteName(storageName, workspaceId), this._encode(raw));
		return storageName;
	}

	private _normalizeSourceData(data: SourceData): void {
		data.userEmail = data.userEmail.toLowerCase();
	}

	private _encode(data: SourceData): string {
		return this._encoder.ecode([JSON.stringify(data)], this.secret);
	}

	private _decode(ticket: string): SourceData {
		const data = this._encoder.decode(this.secret, ticket);
		try {
			return JSON.parse(data[0]);
		} catch (e) {
			throw new Error("Encoded data is malformed, can't decode: " + e.message);
		}
	}

	private _getWorkspaceId(workspacePath: string, encode = true): WorkspacePath {
		assert(workspacePath, "workspacePath is required");
		return encode && workspacePath ? encodeURIComponent(workspacePath) : workspacePath;
	}

	private _getCompleteName(storageName: string, workspaceId?: WorkspacePath, encode = true): string {
		return storageName + this._getPostfix(workspaceId, encode);
	}

	private _getPostfix(workspaceId?: WorkspacePath, encode = true): string {
		const encoded = encode && workspaceId ? encodeURIComponent(workspaceId) : workspaceId;
		return this._postfix + (encoded || this._getWorkspaceId(this._wm.maybeCurrent()?.path(), encode));
	}
}
