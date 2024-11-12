import Url from "@core-ui/ApiServices/Types/Url";
import ApiRequest from "../ApiRequest";
import ApiResponse from "../ApiResponse";
import Middleware from "./Middleware";

const redirectServerURL = "https://docs.ics-it.ru/-develop/";

export class ApiRedirectMiddleware extends Middleware {
	constructor(private _apiRoute: string) {
		super();
	}

	async Process(req: ApiRequest, res: ApiResponse): Promise<void> {
		if (this._app.conf.isReadOnly) return await this._next.Process(req, res);
		const url = { pathname: redirectServerURL + this._apiRoute, query: req.query as { [name: string]: string } };
		res.statusCode = 302;
		res.setHeader("Location", Url.from(url).toString());
		res.end();
	}
}
