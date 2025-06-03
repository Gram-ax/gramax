import type Context from "@core/Context/Context";
import type Cookie from "@ext/cookie/Cookie";
import t from "@ext/localization/locale/translate";
import SourceDataCtx, { type ProxiedSourceDataCtx } from "@ext/storage/logic/SourceDataProvider/logic/SourceDataCtx";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";
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
		const postfix = this._getPostfix();
		const sourceTypes = Object.values(SourceType);

		const allCookieNames = this._cookie.getAllNames();
		const cookieNames = allCookieNames.filter((d) => d.endsWith(postfix));

		return cookieNames
			.map((n) => this.getSourceByName(n.slice(0, -postfix.length)).raw)
			.filter((d) => sourceTypes.includes(d.sourceType));
	}

	isSourceExists(storageName: string): boolean {
		return this._cookie.exist(this._getCompleteName(storageName));
	}

	removeSource(storageName: string): void {
		const name = this._getCompleteName(storageName);
		if (this._cookie.exist(name)) this._cookie.remove(name);
	}

	getSourceByName(storageName: string, workspaceId?: string): ProxiedSourceDataCtx<SourceData> {
		const data = this._cookie.get(this._getCompleteName(storageName, workspaceId));
		if (!data) throw new Error(t("git.source.error.storage-not-exist").replace("{{storage}}", storageName));
		const sourceData = this._decode(data);
		assert(sourceData, "invalid source data; expected a value");
		return SourceDataCtx.init(sourceData, this._authServiceUrl, (sourceData, isValid) => {
			sourceData.isInvalid = !isValid;
			this.updateSource(sourceData, workspaceId);
		});
	}

	updateSource(data: SourceData, workspaceId?: string): string {
		const storageName = getStorageNameByData(data);
		const raw = "raw" in data ? (data.raw as SourceData) : data;
		if (!raw.isInvalid) delete raw.isInvalid;
		this._cookie.set(this._getCompleteName(storageName, workspaceId), this._encode(raw));
		return storageName;
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

	private _getWorkspaceId(workspacePath: string): string {
		assert(workspacePath, "workspacePath is required");

		const hasOldPathCookie = this._cookie
			?.getAllNames()
			?.some((name) => name.includes(this._getPostfix(workspacePath)));
		return hasOldPathCookie ? workspacePath : encodeURIComponent(workspacePath);
	}

	private _getCompleteName(storageName: string, workspaceId?: string): string {
		return storageName + this._getPostfix(workspaceId);
	}

	private _getPostfix(workspaceId?: string): string {
		return this._postfix + (workspaceId ?? this._getWorkspaceId(this._wm.maybeCurrent()?.path()));
	}
}
