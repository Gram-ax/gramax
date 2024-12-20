import ApiRequest from "../../../../logic/Api/ApiRequest";
import ApiResponse from "../../../../logic/Api/ApiResponse";
import Cookie from "../../../cookie/Cookie";
import User from "../User/User";

export interface AuthProvider {
	login(req: ApiRequest, res: ApiResponse): Promise<void> | void;
	logout(req: ApiRequest, res: ApiResponse): Promise<void> | void;
	assertEndpoint(
		req: ApiRequest,
		res: ApiResponse,
		cookie: Cookie,
		setUser: (cookie: Cookie, user: User) => Promise<void>,
	): Promise<void> | void;
}
