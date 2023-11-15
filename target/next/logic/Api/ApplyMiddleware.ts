import { CommandTree } from "@app/commands";
import getApp from "@app/node/app";
import getCommands from "@app/node/commands";
import Application from "@app/types/Application";
import ApiRequest from "@core/Api/ApiRequest";
import ApiResponse from "@core/Api/ApiResponse";
import ApiMiddleware from "@core/Api/middleware/ApiMiddleware";
import Middleware from "@core/Api/middleware/Middleware";

export const ApplyApiMiddleware = (
	api: (this: { app: Application; commands: CommandTree }, req: ApiRequest, res: ApiResponse) => void | Promise<void>,
	middlewares: Middleware[],
) => {
	return async (req: ApiRequest, res: ApiResponse) => {
		const app = await getApp();
		const commands = getCommands(app);
		const apiMiddleware: Middleware = new ApiMiddleware(api.bind({ app, commands }));
		middlewares.push(apiMiddleware);
		middlewares.forEach((m) => m.init({ app, commands }));
		const middleware: Middleware = middlewares.reduceRight((rigth, left) => left.SetNext(rigth));
		await middleware.Process(req, res);
	};
};

export const ApplyPageMiddleware = (
	api: (
		this: { app: Application; commands: CommandTree },
		args: { req: ApiRequest; res: ApiResponse; query: any },
	) => Promise<any>,
) => {
	return async (args: { req: ApiRequest; res: ApiResponse; query: any }) => {
		const app = await getApp();
		return await api.bind({ app, commands: getCommands(app) })(args);
	};
};
