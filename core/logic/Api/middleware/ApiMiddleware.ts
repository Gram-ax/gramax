import ApiRequest from "../ApiRequest";
import ApiResponse from "../ApiResponse";
import Middleware from "./Middleware";

export default class ApiMiddleware extends Middleware {
	constructor(private _api: (req: ApiRequest, res: ApiResponse) => void | Promise<void>) {
		super();
	}

	Process(req: ApiRequest, res: ApiResponse): void | Promise<void> {
		return this._api(req, res);
	}
}
