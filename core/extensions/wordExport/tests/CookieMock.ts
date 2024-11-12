import Cookie from "@ext/cookie/Cookie";

class CookieMock extends Cookie {
	private cookies: { [key: string]: string } = {};

	constructor(secret: string) {
		super(secret);
	}

	set(name: string, value: string) {
		this.cookies[name] = super._encrypt(value);
	}

	remove(name: string): void {
		delete this.cookies[name];
	}

	get(name: string): string {
		return super._decrypt(this.cookies[name]);
	}

	exist(name: string): boolean {
		return !!this.cookies?.[name];
	}

	getAllNames(): string[] {
		return Object.keys(this.cookies);
	}
}

export default CookieMock;
