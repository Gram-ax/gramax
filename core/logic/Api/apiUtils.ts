import type MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import type DefaultError from "../../extensions/errorHandlers/logic/DefaultError";
import Path from "../FileProvider/Path/Path";
import type HashItemProvider from "../Hash/HashItemProvider";
import type HashItem from "../Hash/HashItems/HashItem";
import type ApiRequest from "./ApiRequest";
import type ApiResponse from "./ApiResponse";

export const apiUtils = {
	// Rewrite-reached routes (/robots.txt, /sitemap.xml) can be handed a bare
	// ServerResponse without the NextApiResponse `.send` helper, so `res.send`
	// throws `TypeError: res.send is not a function` (Bugsnag 698339579…). Fall
	// back to `.end` (guaranteed by the ApiResponse contract) in that case.
	send(res: ApiResponse, body: unknown) {
		if (typeof res.send === "function") res.send(body);
		else res.end(typeof body === "string" ? body : JSON.stringify(body));
	},

	sendError(res: ApiResponse, error: DefaultError, code = 500) {
		res.statusCode = code;
		res.setHeader("Content-type", "application/json");
		apiUtils.send(res, {
			isWarning: error.isWarning,
			message: error.message,
			stack: error.stack,
			cause: error.cause
				? {
						stack: error.cause.stack,
						message: error.cause.message,
					}
				: null,
			props: error.props,
			title: error.title,
			icon: error.icon,
			type: error.type,
		});
	},

	getProtocolHost(req: ApiRequest) {
		if (!req.headers.referer) {
			return {
				protocol: req.headers["x-forwarded-proto"] ?? "http",
				host: req.headers["x-forwarded-host"] ?? req.headers.host,
			};
		}
		const [, protocol = "http", host] = /^(?:(https?):\/\/)?([^/]+)/.exec(req.headers.referer);
		return { protocol, host };
	},

	getDomain(req: ApiRequest): string {
		const { protocol, host } = apiUtils.getProtocolHost(req);
		return `${protocol}://${host}`;
	},

	getDomainByBasePath(req: ApiRequest, basePath: string): string {
		const domain = apiUtils.getDomain(req);
		return domain + basePath;
	},

	async sendWithETag(req: ApiRequest, res: ApiResponse, hashItem: HashItem, hashes: HashItemProvider) {
		if (!(await apiUtils.trySetETag(req, res, hashItem, hashes))) res.end();
		else res.end(await hashItem.getContentAsBinary());
	},

	async trySetETag(
		req: ApiRequest,
		res: ApiResponse,
		hashItem: HashItem,
		hashes: HashItemProvider,
	): Promise<boolean> {
		const etag = req.headers["if-none-match"];
		const hash = await hashes.getHash(hashItem);
		if (etag && etag === hash) {
			res.statusCode = 304;
			return false;
		}
		res.setHeader("ETag", await hashes.setHash(hashItem));
		return true;
	},

	sendPlainText(res: ApiResponse, text: string) {
		res.statusCode = 200;
		res.setHeader("Content-type", "text/plain");
		apiUtils.send(res, text);
	},

	sendCss(res: ApiResponse, text: string) {
		res.statusCode = 200;
		res.setHeader("Content-type", "text/css");
		apiUtils.send(res, text);
	},

	sendJson(res: ApiResponse, json: unknown) {
		res.statusCode = 200;
		res.setHeader("Content-type", "application/json");
		apiUtils.send(res, json);
	},

	sendDiagram(res: ApiResponse, diagram: { content: string; mime: MimeTypes }) {
		res.setHeader("Content-Type", diagram.mime);
		res.end(diagram.content);
	},

	getCatalogData(path: string | string[]): { catalogName: string; path: Path } {
		const catalogName = Array.isArray(path) ? path[0] : path;
		return { catalogName, path: new Path(path) };
	},
};
