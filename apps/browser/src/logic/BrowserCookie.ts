import Cookie from "@ext/cookie/Cookie";

export default class BrowserCookie extends Cookie {
	private _newSecret: string;
	private _SECRET_LENGTH_BYTES = 32;
	private _SECRET_STORAGE_KEY = "__cookie__";

	constructor(oldSecret: string) {
		super(oldSecret);
		this._initNewSecret();
	}

	set(name: string, value: string, expires?: number, options?: { encrypt: boolean }): void;
	set(name, value, _, options = { encrypt: true }) {
		const storageValue = options.encrypt ? this._baseEncrypt(value, this._newSecret) : value;
		localStorage.setItem(name, storageValue);
	}

	remove(name: string): void {
		localStorage.removeItem(name);
	}

	get(name: string, decrypt?: boolean): string;
	get(name, decrypt = true) {
		const item = localStorage.getItem(name);
		if (!decrypt) return item;
		try {
			return this._baseDecrypt(item, this._newSecret);
		} catch {
			const value = this._decrypt(item);
			this.set(name, value);
			return value;
		}
	}

	exist(name: string): boolean {
		return !!this.get(name);
	}

	getAllNames(): string[] {
		return Object.keys(localStorage);
	}

	private _initNewSecret(): void {
		let secret = localStorage.getItem(this._SECRET_STORAGE_KEY);
		if (!secret) {
			secret = this._generateSecret();
			localStorage.setItem(this._SECRET_STORAGE_KEY, secret);
		}
		this._newSecret = secret;
	}

	private _generateSecret(): string {
		const bytes = new Uint8Array(this._SECRET_LENGTH_BYTES);
		if (typeof crypto !== "undefined" && crypto.getRandomValues) {
			crypto.getRandomValues(bytes);
		} else {
			for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
		}
		return Array.from(bytes)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
	}
}
