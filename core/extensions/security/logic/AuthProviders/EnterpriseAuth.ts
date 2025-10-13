import ApiRequest from "@core/Api/ApiRequest";
import ApiResponse from "@core/Api/ApiResponse";
import { apiUtils } from "@core/Api/apiUtils";
import Cookie from "@ext/cookie/Cookie";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import EnterpriseUser from "@ext/enterprise/EnterpriseUser";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import { AuthProvider } from "@ext/security/logic/AuthProviders/AuthProvider";
import Permission from "@ext/security/logic/Permission/Permission";
import StrictPermissionMap from "@ext/security/logic/PermissionMap/StrictPermissionMap";
import User from "@ext/security/logic/User/User";
import UserInfo from "@ext/security/logic/User/UserInfo";
import { UserRepositoryProvider } from "@ext/security/logic/UserRepository";
import { Workspace } from "@ext/workspace/Workspace";

class EnterpriseAuth implements UserRepositoryProvider, AuthProvider {
	constructor(private _gesUrl: string, private _getCurrentWorkspace: () => Workspace) {}

	getUser(): Promise<UserInfo> {
		return;
	}

	login(req: ApiRequest, res: ApiResponse): Promise<void> | void {
		const redirectAssert = encodeURIComponent(`${apiUtils.getDomain(req)}/api/auth/assert`);
		const redirect = encodeURIComponent(`${this._gesUrl}/enterprise/sso/assert?redirect=${redirectAssert}`);
		res.redirect(`${this._gesUrl}/sso/login?from=${req.query.from}&redirect=${redirect}`);
	}

	logout(req: ApiRequest, res: ApiResponse): Promise<void> | void {
		res.redirect("/");
	}

	async assertEndpoint(
		req: ApiRequest,
		res: ApiResponse,
		cookie: Cookie,
		setUser: (cookie: Cookie, user: User) => Promise<void>,
	): Promise<void> {
		const from = req.query.from as string;
		const otc = req.query.oneTimeCode as string;
		const ei = new EnterpriseApi(this._gesUrl);
		const token = await ei.getToken(otc);
		const userData = await ei.getUser(token);

		if (!userData) {
			res.redirect(from || "/");
			return;
		}

		const workspacePath = this._getCurrentWorkspace().path();
		const user = new EnterpriseUser(
			true,
			userData.info,
			null,
			new StrictPermissionMap({ [workspacePath]: new Permission(userData.workspacePermissions) }),
			new StrictPermissionMap({}),
			this._gesUrl,
			token,
		);

		await setUser(cookie, user);
		res.redirect(from || "/");
	}

	async mailSendOTP(req: ApiRequest, res: ApiResponse): Promise<void> {
		const email = req.body.email as string;
		if (!email) {
			apiUtils.sendError(res, new DefaultError("Email is required"), 400);
			return;
		}

		const { status, timeLeft } = await new EnterpriseApi(this._gesUrl).mailSendOTP(email);

		if (status === 200) {
			res.statusCode = 200;
			res.send({ message: "Email sent" });
			return;
		}

		if (status === 403) {
			apiUtils.sendError(res, new DefaultError("Forbidden"), 403);
			return;
		}

		if (status === 429) {
			res.statusCode = 429;
			res.send({ message: "Too many requests", timeLeft });
			return;
		}

		apiUtils.sendError(res, new DefaultError("Internal server error"), status);
	}

	async mailLoginOTP(req: ApiRequest, res: ApiResponse): Promise<void> {
		const email = req.body.email as string;
		const otp = req.body.otp as string;

		if (!email || !otp) {
			apiUtils.sendError(res, new DefaultError("Email and OTP are required"), 400);
			return;
		}

		const json = await new EnterpriseApi(this._gesUrl).mailLoginOTP(email, otp);
		const token = json?.token;

		if (!token) {
			apiUtils.sendError(res, new DefaultError("Invalid OTP"), 401);
			return;
		}

		apiUtils.sendPlainText(
			res,
			`${apiUtils.getDomain(req)}/api/auth/assert?enterpriseToken=${encodeURIComponent(token)}`,
		);
	}
}

export default EnterpriseAuth;
