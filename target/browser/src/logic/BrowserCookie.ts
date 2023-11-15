import Cookie from "@ext/cookie/Cookie";

export default class BrowserCookie extends Cookie {
	constructor() {
		super();
	}

	set(name: string, value: string): void {
		localStorage.setItem(name, this._encrypt(value));
	}

	remove(name: string): void {
		localStorage.removeItem(name);
	}

	get(name: string): string {
		return this._decrypt(localStorage.getItem(name));
	}

	exist(name: string): boolean {
		return !!this.get(name);
	}

	getAllNames(): string[] {
		return Object.keys(localStorage);
	}
}
