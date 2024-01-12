import SilentError from "@ext/errorHandlers/silent/SilentError";
import ApiRequest from "../ApiRequest";
import ApiResponse from "../ApiResponse";
import Middleware from "./Middleware";

export class SilentMiddleware extends Middleware {
	constructor() {
		super();
	}

	async Process(req: ApiRequest, res: ApiResponse): Promise<void> {
		try {
			await this._next.Process(req, res);
		} catch (e) {
			throw new SilentError(e);
		}
	}
}
