import getApp from "@app/browser/app";
import getCommands from "@app/browser/commands";
import { findCommand } from "@app/commands";
import Application from "@app/types/Application";
import { ResponseKind } from "@app/types/Command";
import Url from "@core-ui/ApiServices/Types/Url";
import ApiRequest from "@core/Api/ApiRequest";
import ApiResponse from "@core/Api/ApiResponse";
import Query from "@core/Api/Query";
import { apiUtils } from "@core/Api/apiUtils";
import localizer from "@ext/localization/core/Localizer";
import BrowserApiResponse from "./BrowserApiResponse";

const fetchSelf = async (url: Url, body?: BodyInit): Promise<Response> => {
	const route = url.pathname.split("api/").slice(-1)[0];
	const app = await getApp();
	const commands = getCommands(app);
	const command = findCommand(commands, route);
	if (!command) throw new Error(`Route ${route} was not found`);

	Object.entries(url.query)
		.filter(([, v]) => !!v)
		.forEach(([k, v]) => (url.query[k] = decodeURIComponent(v)));

	const req: ApiRequest = { headers: {}, query: url.query, body: parseBody(body) };
	const res: ApiResponse = new BrowserApiResponse();

	const ctx = app.contextFactory.fromBrowser(localizer.extract(location.pathname), {});
	try {
		const params = command.params(ctx, req.query as Query, req.body);
		const result = await command.do(params);
		await respond(app, req, res, command.kind, result);
	} catch (err) {
		apiUtils.sendError(res, err);
		app.logger.logError(err, ctx.user?.info);
		console.log(err);
	}

	return res as unknown as Response;
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
		return commandResult?.hashItem
			? await apiUtils.sendWithETag(req, res, commandResult.hashItem, app.hashes)
			: undefined;

	if (kind == ResponseKind.file) return res.send(commandResult);

	if (kind == ResponseKind.redirect) return res.redirect(commandResult);

	if (kind == ResponseKind.html) return res.send(commandResult);

	throw new Error("Invalid ResponseKind");
};

export default fetchSelf;
