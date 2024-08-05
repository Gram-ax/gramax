import t from "@ext/localization/locale/translate";
import { Encoder } from "../../../../Encoder/Encoder";
import Cookie from "../../../../cookie/Cookie";
import getStorageNameByData from "../../utils/getStorageNameByData";
import SourceData from "../model/SourceData";

export default class SourceDataProvider {
	private _encoder: Encoder;
	private _token = "UGnL8QMQqw";
	private _namePostfix = "_storage_data";

	constructor() {
		this._encoder = new Encoder();
	}

	getDatas(cookie: Cookie): SourceData[] {
		const allCookieNames = cookie.getAllNames();
		const cookieNames = allCookieNames.filter((d) => d.endsWith(this._namePostfix));
		return cookieNames.map((n) => this.getData(cookie, n.slice(0, -this._namePostfix.length)));
	}

	existData(cookie: Cookie, storageName: string): boolean {
		return cookie.exist(this._getName(storageName));
	}

	removeData(cookie: Cookie, storageName: string) {
		const name = this._getName(storageName);
		if (cookie.exist(name)) cookie.remove(name);
	}

	getData(cookie: Cookie, storageName: string): SourceData {
		const data = cookie.get(this._getName(storageName));
		if (!data) throw new Error(t("git.source.error.storage-not-exist").replace("{{storage}}", storageName));
		return this._decodeData(data);
	}

	setData(cookie: Cookie, data: SourceData): string {
		const storageName = getStorageNameByData(data);
		cookie.set(this._getName(storageName), this._encodeData(data));
		return storageName;
	}

	private _encodeData(data: SourceData) {
		return this._encoder.ecode([JSON.stringify(data)], this._token);
	}

	private _decodeData(ticket: string): SourceData {
		const data = this._encoder.decode(this._token, ticket);
		return JSON.parse(data[0]);
	}

	private _getName(storageName: string) {
		return storageName + this._namePostfix;
	}
}
