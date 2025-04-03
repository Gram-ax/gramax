import Cookie from "@ext/cookie/Cookie";

export type OnCookieUpdated = (encoded: Map<string, string>) => Promise<void>;

export default class TauriCookie extends Cookie {
	private static _encoded: Map<string, string> = new Map();
	private static _onCookieUpdated: OnCookieUpdated;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	constructor(secret: string, _req: any, _res: any, private _migrateFrom: Cookie) {
		super(secret);
	}

	static onCookieUpdated(onCookieUpdated: OnCookieUpdated): void {
		TauriCookie._onCookieUpdated = onCookieUpdated;
	}

	static setEncoded(encoded: Map<string, string>): void {
		TauriCookie._encoded = encoded;
	}

	set(name: string, value: string, _expires?: number, options: { encrypt: boolean } = { encrypt: true }): void {
		TauriCookie._encoded.set(name, options.encrypt ? this._encrypt(value) : value);
		void TauriCookie._onCookieUpdated(TauriCookie._encoded);
	}

	remove(name: string): void {
		TauriCookie._encoded.delete(name);
		void TauriCookie._onCookieUpdated(TauriCookie._encoded);
	}

	get(name: string, decrypt = true): string {
		let val = TauriCookie._encoded.get(name);
		if (!val && this._migrateFrom) {
			val = this._migrateFrom.get(name);
			if (val) this.set(name, val);
			return val;
		}
		return val ? (decrypt ? this._decrypt(val) : val) : null;
	}

	exist(name: string): boolean {
		return TauriCookie._encoded.has(name) || (this._migrateFrom && this._migrateFrom.exist(name));
	}

	getAllNames(): string[] {
		const names = new Set(Array.from(TauriCookie._encoded.keys()));
		if (this._migrateFrom) this._migrateFrom.getAllNames().forEach((name) => names.add(name));
		return Array.from(names);
	}
}
