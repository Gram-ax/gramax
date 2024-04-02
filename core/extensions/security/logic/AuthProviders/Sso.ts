import Cookie from "@ext/cookie/Cookie";
import Permission from "@ext/security/logic/Permission/Permission";
import User from "@ext/security/logic/User/User";
import UserInfo from "@ext/security/logic/User/UserInfo2";
import { UserRepositoryProvider } from "@ext/security/logic/UserRepository";

class Sso implements UserRepositoryProvider {
	constructor(private _ssoServerUrl: string) {}

	async getUser(idOrMail: string): Promise<UserInfo> {
		return JSON.parse(await (await fetch(`${this._ssoServerUrl}?userOrMail=${idOrMail}`)).text());
	}

	getAssertUrl(code: string, state: string, domain: string) {
		return `${this._ssoServerUrl}/assert?code=${code}&redirectUrl=${domain}&state=${state}`;
	}

	async getLoginUrl(state: string) {
		return await (
			await fetch(`${this._ssoServerUrl}/login?redirectUrl=${this._ssoServerUrl}&state=${state}`)
		).text();
	}

	setUser(userRaw: string, cookie: Cookie) {
		const userData = { ...JSON.parse(userRaw as any) };
		const user = new User(true, userData.user, new Permission(userData.permissions));

		cookie.set("user", JSON.stringify(user.toJSON()), undefined);
	}

	logOut(cookie) {
		cookie.remove("user");
	}
}

export default Sso;
