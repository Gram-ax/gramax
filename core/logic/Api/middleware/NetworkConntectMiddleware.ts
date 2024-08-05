import haveInternetAccess from "@core/utils/haveInternetAccess";
import NetworkError from "@ext/errorHandlers/network/NetworkError";
import ApiRequest from "../ApiRequest";
import ApiResponse from "../ApiResponse";
import Middleware from "./Middleware";

export class NetworkConnectMiddleWare extends Middleware {
	constructor() {
		super();
	}

	async Process(req: ApiRequest, res: ApiResponse): Promise<void> {
		if (haveInternetAccess()) await this._next.Process(req, res);
		else throw new NetworkError();
	}
}
