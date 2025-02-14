import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import localUser from "@ext/security/logic/User/localUser";
import ApiRequest from "../../../../logic/Api/ApiRequest";
import ApiResponse from "../../../../logic/Api/ApiResponse";
import { apiUtils } from "../../../../logic/Api/apiUtils";
import Path from "../../../../logic/FileProvider/Path/Path";
import ApiUrlCreator from "../../../../ui-logic/ApiServices/ApiUrlCreator";
import Cookie from "../../../cookie/Cookie";
import User from "../User/User";
import { AuthProvider } from "./AuthProvider";

class EnvAuth implements AuthProvider {
	constructor(private _basePath: Path, private _login: string, private _password: string) {}

	login(req: ApiRequest, res: ApiResponse): void | Promise<void> {
		if (!req.body.login || !req.body.password) {
			apiUtils.sendError(res, new DefaultError("Empty login or password"), 401);
			return;
		}

		res.redirect(new ApiUrlCreator(this._basePath.value).getAuthAssertUrl().toString());
	}

	logout(req: ApiRequest, res: ApiResponse): void | Promise<void> {
		const url = decodeURIComponent(req.query.from as string) ?? "/";
		res.statusCode = 302;
		res.redirect(url);
	}

	async assertEndpoint(
		req: ApiRequest,
		res: ApiResponse,
		cookie: Cookie,
		setUser: (cookie: Cookie, user: User) => Promise<void>,
	): Promise<void> {
		if (req.body.login !== this._login || req.body.password !== this._password) {
			apiUtils.sendError(res, new DefaultError("Wrong login or password"), 401);
			return;
		}

		await setUser(cookie, localUser);
		res.send({});
	}
}

export default EnvAuth;
