import { findCommand } from "@app/commands";
import getApp from "@app/node/app";
import getCommands from "@app/node/commands";
import Application from "@app/types/Application";
import { ResponseKind } from "@app/types/ResponseKind";
import { applyCors } from "@components/libs/cors";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiRequest from "@core/Api/ApiRequest";
import ApiResponse from "@core/Api/ApiResponse";
import Query from "@core/Api/Query";
import { apiUtils } from "@core/Api/apiUtils";
import ApiMiddleware from "@core/Api/middleware/ApiMiddleware";
import Middleware from "@core/Api/middleware/Middleware";
import buildMiddleware from "@core/Api/middleware/buildMiddleware";
import PersistentLogger from "@ext/loggers/PersistentLogger";
import { withContext } from "apps/next/logic/Context/ContextHook";

export default async (req: ApiRequest, res: ApiResponse) => {
	Object.entries(req.query)
		.filter(([, v]) => !!v)
		.forEach(([k, v]) => (req.query[k] = typeof v == "string" ? decodeURIComponent(v) : v.map(decodeURIComponent)));

	const path = (req.query.route as string[]).join("/");

	await applyCors(req, res);

	const app = await getApp();
	const commands = getCommands(app);
	const command = findCommand(commands, path);
	if (!command) {
		console.error(`Command ${path} not found`);
		res.statusCode = 404;
		return res.end();
	}

	const process: Middleware = new ApiMiddleware(async (req, res) => {
		const ctx = await app.contextFactory.from(req, res);
		const params = command.params(ctx, req.query as Query, parseBody(req.body));
		PersistentLogger.info(`executing command ${path}`, "cmd", { ...req.query });

		const result = await withContext(ctx, async () => await command.do(params));
		await respond(app, req, res, command.kind, result);
	});

	await buildMiddleware(app, commands, command.middlewares, process).Process(req, res);
};

const parseBody = (body: BodyInit) => {
	if (body === "") return body;
	if (!body) return;
	if (typeof body != "string") return body;
	try {
		return JSON.parse(body);
	} catch {
		return body;
	}
};

const respond = async (app: Application, req: ApiRequest, res: ApiResponse, kind: ResponseKind, commandResult: any) => {
	if (kind == ResponseKind.none) return res.end();

	if (kind == ResponseKind.json) return apiUtils.sendJson(res, commandResult);

	if (kind == ResponseKind.plain) return apiUtils.sendPlainText(res, commandResult);

	if (kind == ResponseKind.blob) {
		if (!commandResult) return res.end();
		const { mime, hashItem } = commandResult;
		if (mime) res.setHeader("Content-Type", mime);
		if (mime == MimeTypes.xml || mime == MimeTypes.xls || MimeTypes.xlsx)
			res.setHeader(
				"Content-Disposition",
				`attachment; filename=${encodeURIComponent(req.query?.src as string)}`,
			);
		if (hashItem) return await apiUtils.sendWithETag(req, res, hashItem, app.hashes);
		return res.end();
	}

	if (kind == ResponseKind.file) {
		return res.end(commandResult);
	}

	if (kind == ResponseKind.redirect) {
		res.redirect(commandResult);
		return res.end();
	}

	if (kind == ResponseKind.html) {
		res.setHeader("Content-type", "text/html; charset=utf-8");
		return res.send(commandResult);
	}

	throw new Error("Invalid ResponseKind");
};
