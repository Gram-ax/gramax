import { Encoder } from "../../../../Encoder/Encoder";
import ShareLinkData from "../model/ShareLinkData";

export default class ShareLinkHandler {
	private _accessToken = "reviewToken";
	private _encoder: Encoder;
	constructor() {
		this._encoder = new Encoder();
	}

	createShareLinkTicket(data: ShareLinkData): string {
		return this._encoder.ecode(this._stringifyData(data), this._accessToken, "hex");
	}

	getShareLink(ticket: string): ShareLinkData {
		return this._parseData(this._encoder.decode(this._accessToken, ticket, "hex"));
	}

	private _stringifyData(data: ShareLinkData): string[] {
		return [JSON.stringify(data)];
	}

	private _parseData(data: string[]): ShareLinkData {
		if (!data) throw new Error("Некорректный тикет");
		return JSON.parse(data[0]);
	}
}
