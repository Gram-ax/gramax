import type { EnterpriseConfig } from "@app/config/AppConfig";
// import type EnterpriseUser from "@ext/enterprise/EnterpriseUser";
import type ApiRequest from "../../../logic/Api/ApiRequest";
import type ApiResponse from "../../../logic/Api/ApiResponse";
import type Cookie from "../../cookie/Cookie";
import type User from "./User/User";

type Query = {
	[key: string]: string | string[];
};

export default abstract class AuthManager {
	protected readonly _COOKIE_USER = "user";

	constructor(protected _enterpriseConfig: EnterpriseConfig) {}

	abstract getUser(cookie: Cookie, query: Query, headers?: ApiRequest["headers"]): Promise<User>;
	abstract assert(
		req: ApiRequest,
		res: ApiResponse,
		cookie: Cookie,
		onSuccess: (user: User) => Promise<void>,
	): Promise<void>;
	abstract login(req: ApiRequest, res: ApiResponse): Promise<void>;
	abstract logout(cookie: Cookie, req?: ApiRequest, res?: ApiResponse): Promise<void>;
	abstract mailSendOTP(req: ApiRequest, res: ApiResponse): Promise<void>;
	abstract mailLoginOTP(req: ApiRequest, res: ApiResponse): Promise<void>;

	setUser(cookie: Cookie, user: User, expires?: number): void {
		cookie.set(this._COOKIE_USER, JSON.stringify(user.toJSON()), expires);
	}
}
