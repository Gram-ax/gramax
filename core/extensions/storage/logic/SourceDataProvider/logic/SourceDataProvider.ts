import t from "@ext/localization/locale/translate";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import WorkspaceManager from "@ext/workspace/WorkspaceManager";
import { Encoder } from "../../../../Encoder/Encoder";
import Cookie from "../../../../cookie/Cookie";
import getStorageNameByData from "../../utils/getStorageNameByData";
import SourceData from "../model/SourceData";

export default class SourceDataProvider {
	private _encoder: Encoder;
	private _token = "UGnL8QMQqw";
	private _oldNamePostfix = "_storage_data";

	constructor(private _wm: WorkspaceManager) {
		this._encoder = new Encoder();
	}

	getDatas(cookie: Cookie): SourceData[] {
		this._migrateOldStoragesToNewFormat(cookie);
		const allCookieNames = cookie.getAllNames();
		const cookieNames = allCookieNames.filter((d) => d.endsWith(this._getNamePostfix()));
		const sourceTypes = Object.values(SourceType);
		return cookieNames
			.map((n) => this.getData(cookie, n.slice(0, -this._getNamePostfix().length)))
			.filter((d) => sourceTypes.includes(d.sourceType));
	}

	existData(cookie: Cookie, storageName: string): boolean {
		return cookie.exist(this._getName(storageName));
	}

	removeData(cookie: Cookie, storageName: string) {
		const name = this._getName(storageName);
		if (cookie.exist(name)) cookie.remove(name);
	}

	getData(cookie: Cookie, storageName: string, workspaceId?: string): SourceData {
		const data = cookie.get(this._getName(storageName, workspaceId));
		if (!data) throw new Error(t("git.source.error.storage-not-exist").replace("{{storage}}", storageName));
		return this._decodeData(data);
	}

	setData(cookie: Cookie, data: SourceData, workspaceId?: string): string {
		const storageName = getStorageNameByData(data);
		cookie.set(this._getName(storageName, workspaceId), this._encodeData(data));
		return storageName;
	}

	private _encodeData(data: SourceData) {
		return this._encoder.ecode([JSON.stringify(data)], this._token);
	}

	private _decodeData(ticket: string): SourceData {
		const data = this._encoder.decode(this._token, ticket);
		return JSON.parse(data[0]);
	}

	private _getName(storageName: string, workspaceId?: string) {
		return storageName + this._getNamePostfix(workspaceId);
	}

	private _migrateOldStoragesToNewFormat(cookie: Cookie) {
		const allCookieNames = cookie.getAllNames();
		const oldCookieNames = allCookieNames.filter((d) => d.endsWith(this._oldNamePostfix));
		if (!oldCookieNames.length) return;
		const sourceTypes = Object.values(SourceType);
		const storages = oldCookieNames
			.map((n) => this.getData(cookie, n.slice(0, -this._oldNamePostfix.length), ""))
			.filter((d) => sourceTypes.includes(d.sourceType));

		const workspaceIds = this._wm.workspaces().map((w) => this._getWorkspaceId(w.path));

		workspaceIds.forEach((id) => {
			storages.map((d) => this.setData(cookie, d, id));
		});

		oldCookieNames.map((n) => cookie.remove(n));
	}

	private _getNamePostfix(workspaceId?: string) {
		return this._oldNamePostfix + (workspaceId ?? this._getWorkspaceId(this._wm.current().path()));
	}

	private _getWorkspaceId(workspacePath: string) {
		return workspacePath;
	}
}
