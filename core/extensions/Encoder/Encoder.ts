import { Buffer } from "buffer";
import crypto from "crypto";

export class Encoder {
	private _algorithm = "aes-256-cbc";
	private _ticketChar = ":";
	private _dataChar = "|_|-|_|";

	public ecode(datas: string[], accessToken: string, encoding: "base64" | "hex" = "base64"): string {
		const iv = this._randomstring(16);
		const encryptedBase64 = this._ecodeAes(datas.join(this._dataChar), iv, accessToken, encoding);
		const ivBase64 = Buffer.from(iv, "utf8").toString(encoding);
		return this._createTicket(ivBase64, encryptedBase64);
	}

	public decode(accessToken: string, ticket: string, encoding: "base64" | "hex" = "base64"): string[] {
		const { iv, encrypted } = this._parseTicket(ticket);
		if (!accessToken) return null;
		const datas = this._decodeSafe(iv, encrypted, accessToken, encoding);
		if (!datas) return null;
		return datas.split(this._dataChar);
	}

	private _parseTicket(ticket: string): { iv: string; encrypted: string } {
		const [iv, encrypted] = ticket.split(this._ticketChar);
		return { iv, encrypted };
	}
	private _createTicket(iv: string, encrypted: string): string {
		return iv + this._ticketChar + encrypted;
	}

	private _decodeSafe(iv: string, encrypted: string, accessToken: string, encoding: "base64" | "hex"): string {
		try {
			return this._decodeAes(encrypted, iv, accessToken, encoding);
		} catch {
			return null;
		}
	}

	private _ecodeAes(utf8String: string, iv: string, accessToken: string, encoding: "base64" | "hex"): string {
		const keyBuffer = this._getKeyByffer(accessToken);
		const ivBuffer = Buffer.from(iv, "utf-8");

		const cipher = crypto.createCipheriv(
			this._algorithm as crypto.CipherGCMTypes,
			keyBuffer as unknown as crypto.CipherKey,
			ivBuffer as unknown as crypto.BinaryLike,
		);
		let encrypted = cipher.update(utf8String, "utf8", encoding);
		encrypted += cipher.final(encoding);
		return encrypted;
	}

	private _decodeAes(
		base64String: string,
		base64iv: string,
		accessToken: string,
		encoding: "base64" | "hex",
	): string {
		const keyBuffer = this._getKeyByffer(accessToken);
		const ivBuffer = Buffer.from(base64iv, encoding);

		const decipher = crypto.createDecipheriv(
			this._algorithm as crypto.CipherGCMTypes,
			keyBuffer as unknown as crypto.CipherKey,
			ivBuffer as unknown as crypto.BinaryLike,
		);
		let decrypted = decipher.update(base64String, encoding, "utf8");
		decrypted += decipher.final("utf8");
		return decrypted;
	}

	private _getKeyByffer(accessToken: string): Buffer {
		return crypto.createHash("sha256", { encoding: "utf-8" }).update(accessToken).digest();
	}

	private _randomstring(length) {
		let result = "";
		const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		const charactersLength = characters.length;
		for (let i = 0; i < length; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength));
		}
		return result;
	}
}
