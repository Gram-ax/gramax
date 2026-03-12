import Cookie from "@ext/cookie/Cookie";

export type OnCookieUpdated = (encoded: Map<string, string>) => Promise<void>;

export default class TauriCookie extends Cookie {
	private static _encoded: Map<string, string> = new Map();
	private static _onCookieUpdated: OnCookieUpdated;

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
		const val = TauriCookie._encoded.get(name);
		return val ? (decrypt ? this._decrypt(val) : val) : null;
	}

	exist(name: string): boolean {
		return TauriCookie._encoded.has(name);
	}

	getAllNames(): string[] {
		return Array.from(TauriCookie._encoded.keys());
	}
}
