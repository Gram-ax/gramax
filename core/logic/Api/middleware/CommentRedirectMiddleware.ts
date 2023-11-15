import Url from "@core-ui/ApiServices/Types/Url";
import ApiRequest from "../ApiRequest";
import ApiResponse from "../ApiResponse";
import Middleware from "./Middleware";
const CommentServerURL = "https://docs.ics-it.ru/";

export class CommentRedirectMiddleware extends Middleware {
	constructor(private _apiRoute: string, private _contentType: "application/json" = null) {
		super();
	}

	async Process(req: ApiRequest, res: ApiResponse): Promise<void> {
		if (this._app.conf.isServerApp) return this._next.Process(req, res);
		if (!Object.keys(req.query).length) {
			res.end();
			return;
		}

		const catalog = await this._app.lib.getCatalog(req.query.catalogName as string);
		req.query.repositoryUrl = await catalog.getStorage().getUrl();
		const url = Url.fromBasePath(
			CommentServerURL + this._apiRoute,
			"/",
			req.query as { [name: string]: string },
		).toString();
		const reqParam = {
			method: "POST",
			body: req.body,
			headers: { Cookie: req.headers.cookie },
		};
		if (this._contentType) {
			res.setHeader("Content-Type", this._contentType);
			res.send(await (await fetch(url, reqParam)).json());
		} else {
			await fetch(url, reqParam);
			res.end();
		}
	}
}
