import ApiRequest from "@core/Api/ApiRequest";
import ApiResponse from "@core/Api/ApiResponse";
import { apiUtils } from "@core/Api/apiUtils";
import Cookie from "@ext/cookie/Cookie";
import { AuthProvider } from "@ext/security/logic/AuthProviders/AuthProvider";
import Permission from "@ext/security/logic/Permission/Permission";
import User from "@ext/security/logic/User/User";
import UserInfo from "@ext/security/logic/User/UserInfo2";
import { UserRepositoryProvider } from "@ext/security/logic/UserRepository";
import { KEYUTIL, KJUR } from "jsrsasign";

class Sso implements UserRepositoryProvider, AuthProvider {
	constructor(private _ssoServerUrl: string, private _publicKey: string) {}

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

	login(req: ApiRequest, res: ApiResponse): Promise<void> | void {
		res.redirect(
			`${this._ssoServerUrl}/login?from=${req.query.from}&redirect=${encodeURIComponent(
				`${apiUtils.getDomain(req)}/api/auth/assert`,
			)}`,
		);
	}

	logout(req: ApiRequest, res: ApiResponse): Promise<void> | void {
		res.redirect(`${this._ssoServerUrl}/logout?from=${req.query.from}`);
	}

	assertEndpoint(
		req: ApiRequest,
		res: ApiResponse,
		cookie: Cookie,
		setUser: (cookie: Cookie, user: User) => void,
	): Promise<void> | void {
		const from = req.query.from as string;
		const sign = req.query.sign as string;
		const data = req.query.data as string;

		const publicKey = KEYUTIL.getKey(this._publicKey);

		const userData = Buffer.from(decodeURIComponent(data.replace("\\", "/")), "base64");
		const decodedUserData = userData.toString();

		const signature = decodeURIComponent(sign);
		const sig = new KJUR.crypto.Signature({ alg: "SHA256withRSA" });

		sig.init(publicKey);
		sig.updateString(decodedUserData);

		if (!sig.verify(signature)) return console.error("Signature verification failed.");

		const userInfo = JSON.parse(decodedUserData);
		const user = new User(true, userInfo.userInfo, new Permission(userInfo.globalPermission));
		setUser(cookie, user);
		res.redirect(from ?? "/");
	}
}

export default Sso;
