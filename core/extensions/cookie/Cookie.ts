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
		return this._baseEncrypt(value, this._secret);
	}

	protected _decrypt(value: string): string {
		try {
			return this._baseDecrypt(value ?? "", this._secret);
		} catch {
			try {
				return this._baseDecrypt(value ?? "", "");
			} catch {
				try {
					return this._baseDecrypt(value ?? "", ".");
				} catch (e) {
					console.warn(new Error("Cookie decrypt error", { cause: e }));
				}
			}
		}
	}

	protected _baseDecrypt(value: string, secret: string): string {
		return cryptoJS.AES.decrypt(value ?? "", secret).toString(cryptoJS.enc.Utf8);
	}

	protected _baseEncrypt(value: string, secret: string): string {
		return cryptoJS.AES.encrypt(value, secret).toString();
	}

	protected _parse(cookieString: string, name: string) {
		const reg = new RegExp(`${name}=([^;]*)($|;)`);
		return reg.exec(cookieString)?.[1];
	}
}
