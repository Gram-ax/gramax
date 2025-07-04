import cryptoJS from "crypto-js";

export default abstract class Cookie {
	abstract set(name: string, value: string, expires?: number): void;
	abstract remove(name: string): void;
	abstract get(name: string): string;
	abstract exist(name: string): boolean;
	abstract getAllNames(): string[];

	private _secret: string;

	constructor(secret: string) {
		this._secret = secret || ".";
	}

	protected _encrypt(value: string): string {
		return cryptoJS.AES.encrypt(value, this._secret).toString();
	}

	protected _decrypt(value: string): string {
		try {
			return cryptoJS.AES.decrypt(value ?? "", this._secret).toString(cryptoJS.enc.Utf8);
		} catch (e) {
			try {
				return cryptoJS.AES.decrypt(value ?? "", "").toString(cryptoJS.enc.Utf8);
			} catch {
				try {
					return cryptoJS.AES.decrypt(value ?? "", ".").toString(cryptoJS.enc.Utf8);
				} catch (e) {
					console.warn(new Error("Cookie decrypt error", { cause: e }));
				}
			}
		}
	}

	protected _parse(cookieString: string, name: string) {
		const reg = new RegExp(`${name}=([^;]*)($|;)`);
		return reg.exec(cookieString)?.[1];
	}
}
