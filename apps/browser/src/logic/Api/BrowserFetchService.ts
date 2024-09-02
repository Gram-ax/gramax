import getApp from "@app/browser/app";
import getCommands from "@app/browser/commands";
import { findCommand } from "@app/commands";
import Application from "@app/types/Application";
import { ResponseKind } from "@app/types/ResponseKind";
import FetchResponse from "@core-ui/ApiServices/Types/FetchResponse";
import Url from "@core-ui/ApiServices/Types/Url";
import trimRoutePrefix from "@core-ui/ApiServices/trimRoutePrefix";
import ApiRequest from "@core/Api/ApiRequest";
import ApiResponse from "@core/Api/ApiResponse";
import Query from "@core/Api/Query";
import { apiUtils } from "@core/Api/apiUtils";
import ApiMiddleware from "@core/Api/middleware/ApiMiddleware";
import Middleware from "@core/Api/middleware/Middleware";
import buildMiddleware from "@core/Api/middleware/buildMiddleware";
import type HashResourceManager from "@core/Hash/HashItems/HashResourceManager";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import PersistentLogger from "@ext/loggers/PersistentLogger";
import BrowserApiResponse from "./BrowserApiResponse";

const fetchSelf = async (url: Url, body?: BodyInit): Promise<FetchResponse> => {
	const route = trimRoutePrefix(url);
	const res: ApiResponse = new BrowserApiResponse();
	const app = await getApp();
	const commands = getCommands(app);
	const command = findCommand(commands, route);

	if (!command) {
		const msg = `Route ${route} was not found`;
		const err = new Error(msg);
		PersistentLogger.err("command not found", err, "cmd", { body });
		res.statusCode = 404;
		res.send(msg);
		return res as unknown as FetchResponse;
	}

	Object.entries(url.query)
		.filter(([, v]) => !!v)
		.forEach(([k, v]) => (url.query[k] = decodeURIComponent(v)));

	const req: ApiRequest = { headers: {}, query: url.query, body: parseBody(body) };

	const process: Middleware = new ApiMiddleware(async (req, res) => {
		const ctx = app.contextFactory.fromBrowser(
			RouterPathProvider.parsePath(window.location.pathname)?.language,
			{},
		);
		const params = command.params(ctx, req.query as Query, req.body);
		PersistentLogger.info(`executing command ${route}`, "cmd", { ...req.query });
		const result = await command.do(params);
		await respond(app, req, res, command.kind, result);
	});

	await buildMiddleware(app, commands, command.middlewares, process).Process(req, res);

	return res as unknown as FetchResponse;
};

const parseBody = (body: BodyInit) => {
	if (!body) return;
	if (typeof body != "string") return body;
	try {
		return JSON.parse(body);
	} catch {
		return body;
	}
};

const respond = async (app: Application, req: ApiRequest, res: ApiResponse, kind: ResponseKind, commandResult: any) => {
	if (kind == ResponseKind.none) return;

	if (kind == ResponseKind.json) return apiUtils.sendJson(res, commandResult);

	if (kind == ResponseKind.plain) return apiUtils.sendPlainText(res, commandResult);

	if (kind == ResponseKind.blob)
		return res.send(await (commandResult?.hashItem as HashResourceManager)?.getContentAsBinary());

	if (kind == ResponseKind.file) return res.send(commandResult);

	if (kind == ResponseKind.redirect) return res.redirect(commandResult);

	if (kind == ResponseKind.html) return res.send(commandResult);

	throw new Error("Invalid ResponseKind");
};

export default fetchSelf;
