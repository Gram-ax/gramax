import ApiRequest from "@core/Api/ApiRequest";
import ApiResponse from "@core/Api/ApiResponse";
import Cookie from "@ext/cookie/Cookie";
import { parseCookies, setCookie } from "nookies";

export default class NextCookie extends Cookie {
	constructor(secret: string, private _req: ApiRequest, private _res: ApiResponse) {
		super(secret);
	}

	set(name: string, value: string, expires: number, options?: { encrypt: boolean }): void;
	set(name, value, expires = 12 * 30 * 24 * 60 * 60, options = { encrypt: true }) {
		setCookie({ res: this._res as any }, name, this.encrypt(value, !options.encrypt), {
			maxAge: expires,
			path: "/",
		});
	}

	remove(name: string): void {
		this.set(name, "", 0);
	}

	get(name: string, decrypt?: boolean): string | undefined;
	get(name, decrypt = true) {
		const cookie = this._parse(this._req?.headers?.cookie, name);
		if (!cookie) return;

		return this.decrypt(decodeURIComponent(cookie), !decrypt);
	}

	exist(name: string): boolean {
		return !!this.get(name);
	}

	getAllNames(): string[] {
		return Object.keys(parseCookies({ req: this._req as any }));
	}

	protected encrypt(value: string, ignore: boolean): string {
		if (ignore) return value;
		return this._encrypt(value);
	}

	protected decrypt(value: string, ignore: boolean): string {
		if (ignore) return value;
		return super._decrypt(value);
	}
}
