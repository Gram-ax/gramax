import ApiRequest from "@core/Api/ApiRequest";
import ApiResponse from "@core/Api/ApiResponse";
import { apiUtils } from "@core/Api/apiUtils";
import Cookie from "@ext/cookie/Cookie";
import { AuthProvider } from "@ext/security/logic/AuthProviders/AuthProvider";
import Permission from "@ext/security/logic/Permission/Permission";
import User from "@ext/security/logic/User/User";
import UserInfo from "@ext/security/logic/User/UserInfo2";
import { UserRepositoryProvider } from "@ext/security/logic/UserRepository";
import crypto from "crypto";

class Sso implements UserRepositoryProvider, AuthProvider {
	private _key: Buffer;
	constructor(private _ssoServerUrl: string, ssoServerKey: string) {
		if (!ssoServerKey) throw new Error("Decryption key not set");
		this._key = Buffer.from(ssoServerKey, "hex");
	}

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
		const data = req.query.data as string;

		const parts = data.split(":");
		const iv = Buffer.from(parts[0], "hex");

		const encrypted = parts[1];

		try {
			const decipher = crypto.createDecipheriv("aes-256-cbc", this._key, iv);
			let decrypted = decipher.update(encrypted, "hex", "utf8");
			decrypted += decipher.final("utf8");

			const userInfo = JSON.parse(decrypted);
			const user = new User(true, userInfo.userInfo, new Permission(userInfo.globalPermission));

			setUser(cookie, user);
			res.redirect(from || "/");
		} catch (e) {
			console.log({ data, iv });
			throw new Error("DecryptUserData error", { cause: e });
		}
	}
}

export default Sso;
