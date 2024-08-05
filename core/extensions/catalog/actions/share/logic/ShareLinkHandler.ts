import t from "@ext/localization/locale/translate";
import { Encoder } from "../../../../Encoder/Encoder";
import ShareData from "../model/ShareData";

export default class ShareLinkHandler {
	private _accessToken = "reviewToken";
	private _encoder: Encoder;
	constructor() {
		this._encoder = new Encoder();
	}

	createShareLinkTicket(data: ShareData): string {
		return this._encoder.ecode(this._stringifyData(data), this._accessToken, "hex");
	}

	getShareLink(ticket: string): ShareData {
		return this._parseData(this._encoder.decode(this._accessToken, ticket, "hex"));
	}

	private _stringifyData(data: ShareData): string[] {
		return [JSON.stringify(data)];
	}

	private _parseData(data: string[]): ShareData {
		if (!data) throw new Error(t("share.error.incorrect-ticket"));
		return JSON.parse(data[0]);
	}
}
