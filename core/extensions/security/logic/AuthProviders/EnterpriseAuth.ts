import ApiRequest from "@core/Api/ApiRequest";
import ApiResponse from "@core/Api/ApiResponse";
import { apiUtils } from "@core/Api/apiUtils";
import Cookie from "@ext/cookie/Cookie";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import EnterpriseUser from "@ext/enterprise/EnterpriseUser";
import { AuthProvider } from "@ext/security/logic/AuthProviders/AuthProvider";
import Permission from "@ext/security/logic/Permission/Permission";
import User from "@ext/security/logic/User/User";
import UserInfo from "@ext/security/logic/User/UserInfo";
import { UserRepositoryProvider } from "@ext/security/logic/UserRepository";

class EnterpriseAuth implements UserRepositoryProvider, AuthProvider {
	constructor(private _gesUrl: string) {}

	async getUser(idOrMail: string): Promise<UserInfo> {
		try {
			const url = `${this._gesUrl}/enterprise/sso/get-user?userOrMail=${idOrMail}`;
			return (await (await fetch(url)).json()) as UserInfo;
		} catch (e) {
			console.error(e);
		}
	}

	login(req: ApiRequest, res: ApiResponse): Promise<void> | void {
		const redirectAssert = encodeURIComponent(`${apiUtils.getDomain(req)}/api/auth/assert`);
		const redirect = encodeURIComponent(`${this._gesUrl}/enterprise/sso/assert?redirect=${redirectAssert}`);
		res.redirect(`${this._gesUrl}/sso/login?from=${req.query.from}&redirect=${redirect}`);
	}

	logout(req: ApiRequest, res: ApiResponse): Promise<void> | void {
		res.redirect(`${this._gesUrl}/sso/logout?from=${req.query.from}`);
	}

	async assertEndpoint(
		req: ApiRequest,
		res: ApiResponse,
		cookie: Cookie,
		setUser: (cookie: Cookie, user: User) => Promise<void>,
	): Promise<void> {
		const from = req.query.from as string;
		const token = decodeURIComponent(req.query.enterpriseToken as string);

		const userData = await new EnterpriseApi(this._gesUrl).getUser(token);
		if (!userData) {
			res.redirect(from || "/");
			return;
		}

		const user = new EnterpriseUser(
			true,
			userData.info,
			new Permission(userData.globalPermission),
			null,
			this._gesUrl,
			token,
		);

		await setUser(cookie, user);
		res.redirect(from || "/");
	}
}

export default EnterpriseAuth;
