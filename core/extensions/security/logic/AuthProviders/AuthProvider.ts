import type ApiRequest from "../../../../logic/Api/ApiRequest";
import type ApiResponse from "../../../../logic/Api/ApiResponse";
import type Cookie from "../../../cookie/Cookie";
import type User from "../User/User";

export interface AuthProvider {
	login(req: ApiRequest, res: ApiResponse): Promise<void> | void;
	logout(req: ApiRequest, res: ApiResponse): Promise<void> | void;
	assertEndpoint(
		req: ApiRequest,
		res: ApiResponse,
		cookie: Cookie,
		setUser: (cookie: Cookie, user: User) => Promise<void>,
	): Promise<void> | void;
	mailLoginOTP(req: ApiRequest, res: ApiResponse): Promise<void> | void;
	mailSendOTP(req: ApiRequest, res: ApiResponse): Promise<void> | void;
}
