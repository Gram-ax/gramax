import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import DefaultError from "../../extensions/errorHandlers/logic/DefaultError";
import Path from "../FileProvider/Path/Path";
import Hash from "../Hash/Hash";
import HashItem from "../Hash/HashItems/HashItem";
import ApiRequest from "./ApiRequest";
import ApiResponse from "./ApiResponse";

export const apiUtils = {
	sendError(res: ApiResponse, error: DefaultError, code = 500) {
		res.statusCode = code;
		res.setHeader("Content-type", "application/json");
		res.send({
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
				host: req.headers["x-forwarded-host"] ?? req.headers["host"],
			};
		}
		const [, protocol = "http", host] = /^(?:(https?):\/\/)?([^/]+)/.exec(req.headers.referer);
		return { protocol, host };
	},

	getDomain(req: ApiRequest): string {
		const { protocol, host } = apiUtils.getProtocolHost(req);
		return protocol + "://" + host;
	},

	getDomainByBasePath(req: ApiRequest, basePath: string): string {
		const domain = apiUtils.getDomain(req);
		return domain + basePath;
	},

	async sendWithETag(req: ApiRequest, res: ApiResponse, hashItem: HashItem, hashes: Hash) {
		if (!(await apiUtils.trySetETag(req, res, hashItem, hashes))) res.end();
		else res.end(await hashItem.getContentAsBinary());
	},

	async trySetETag(req: ApiRequest, res: ApiResponse, hashItem: HashItem, hashes: Hash): Promise<boolean> {
		const etag = req.headers["if-none-match"];
		const hash = await hashes.getHash(hashItem);
		if (etag && etag == hash) {
			res.statusCode = 304;
			return false;
		} else {
			res.setHeader("ETag", await hashes.setHash(hashItem));
			return true;
		}
	},

	sendPlainText(res: ApiResponse, text: string) {
		res.statusCode = 200;
		res.setHeader("Content-type", "text/plain");
		res.send(text);
	},

	sendJson(res: ApiResponse, json: any) {
		res.statusCode = 200;
		res.setHeader("Content-type", "application/json");
		res.send(json);
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
