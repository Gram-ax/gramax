import Cookie from "@ext/cookie/Cookie";

export default class BrowserCookie extends Cookie {
	constructor(secret: string) {
		super(secret);
	}

	set(name: string, value: string, expires?: number, options?: { encrypt: boolean }): void;
	set(name, value, expired, options = { encrypt: true }) {
		const storageValue = options.encrypt ? this._encrypt(value) : value;
		localStorage.setItem(name, storageValue);
	}

	remove(name: string): void {
		localStorage.removeItem(name);
	}

	get(name: string, decrypt?: boolean): string;
	get(name, decrypt = true) {
		const item = localStorage.getItem(name);
		return decrypt ? this._decrypt(item) : item;
	}

	exist(name: string): boolean {
		return !!this.get(name);
	}

	getAllNames(): string[] {
		return Object.keys(localStorage);
	}
}
