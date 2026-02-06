import haveInternetAccess from "@core/utils/haveInternetAccess";
import NetworkError from "@ext/errorHandlers/network/NetworkError";
import type ApiRequest from "../ApiRequest";
import type ApiResponse from "../ApiResponse";
import Middleware from "./Middleware";

export class NetworkConnectMiddleWare extends Middleware {
	async Process(req: ApiRequest, res: ApiResponse): Promise<void> {
		if (await haveInternetAccess(this?._app?.em?.getConfig?.()?.gesUrl)) await this._next.Process(req, res);
		else throw new NetworkError();
	}
}
