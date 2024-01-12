import ApiRequest from "@core/Api/ApiRequest";
import ApiResponse from "@core/Api/ApiResponse";
import Cookie from "@ext/cookie/Cookie";
import { parseCookies, setCookie } from "nookies";

export default class NextCookie extends Cookie {
	constructor(secret: string, private _req: ApiRequest, private _res: ApiResponse) {
		super(secret);
	}

	set(name: string, value: string, expires = 30 * 24 * 60 * 60): void {
		setCookie({ res: this._res as any }, name, this._encrypt(value), { maxAge: expires, path: "/" });
	}

	remove(name: string): void {
		this.set(name, "", 0);
	}

	get(name: string): string {
		const cookie = this._parse(this._req.headers.cookie, name);
		if (!cookie) return;
		return this._decrypt(decodeURIComponent(cookie));
	}

	exist(name: string): boolean {
		return !!this.get(name);
	}

	getAllNames(): string[] {
		return Object.keys(parseCookies({ req: this._req }));
	}
}
