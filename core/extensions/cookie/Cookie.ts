import cryptoJS from "crypto-js";

const SECRET = `I$f/~FDUM,FPh"o'4_ZCb_3jQlvtquP_w(`;

export default abstract class Cookie {
	abstract set(name: string, value: string, expires?: number): void;
	abstract remove(name: string): void;
	abstract get(name: string): string;
	abstract exist(name: string): boolean;
	abstract getAllNames(): string[];

	protected _encrypt(value: string): string {
		return cryptoJS.AES.encrypt(value, SECRET).toString();
	}

	protected _decrypt(value: string): string {
		return cryptoJS.AES.decrypt(value ?? "", SECRET).toString(cryptoJS.enc.Utf8);
	}

	protected _parse(cookieString: string, name: string) {
		const reg = new RegExp(`${name}=([^;]*)($|;)`);
		return reg.exec(cookieString)?.[1];
	}
}
