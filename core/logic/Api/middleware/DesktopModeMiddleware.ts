import ApiRequest from "../ApiRequest";
import ApiResponse from "../ApiResponse";
import Middleware from "./Middleware";

export class DesktopModeMiddleware extends Middleware {
	constructor(private _api: (req: ApiRequest, res: ApiResponse) => boolean | Promise<boolean> = null) {
		super();
	}

	Process(req: ApiRequest, res: ApiResponse): Promise<void> {
		if (this._app.conf.isReadOnly) throw new Error("Not available in server mode");
		if (!this._api) return this._next.Process(req, res);
		else if (this._api(req, res)) return this._next.Process(req, res);
	}
}
