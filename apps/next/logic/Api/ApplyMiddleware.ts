import type { CommandTree } from "@app/commands";
import getApp from "@app/node/app";
import getCommands from "@app/node/commands";
import type Application from "@app/types/Application";
import type ApiRequest from "@core/Api/ApiRequest";
import type ApiResponse from "@core/Api/ApiResponse";
import ApiMiddleware from "@core/Api/middleware/ApiMiddleware";
import type Middleware from "@core/Api/middleware/Middleware";
import {
	defaultOnError,
	defaultOnPluginLoadError,
	loadRouteWorkspacePlugins,
	type RouteWorkspacePluginPreload,
} from "@plugins/bootstrap/loadRouteWorkspacePlugins";
import {
	createServerPluginState,
	serverClearAllPlugins,
	serverGetPluginIsReady,
	serverLoadPlugins,
	serverMakePluginReady,
	serverPluginStorage,
} from "@plugins/store/serverPluginStore";

interface MiddlewareOptions<TArgs> {
	plugins?: RouteWorkspacePluginPreload<TArgs>;
}

type PageQuery = Record<string, string | string[] | undefined>;
type PageMiddlewareArgs = { req: ApiRequest; res: ApiResponse; query: PageQuery };

export const ApplyApiMiddleware = (
	api: (this: { app: Application; commands: CommandTree }, req: ApiRequest, res: ApiResponse) => void | Promise<void>,
	middlewares: Middleware[],
	options?: MiddlewareOptions<ApiRequest>,
) => {
	return async (req: ApiRequest, res: ApiResponse) => {
		return serverPluginStorage.run(createServerPluginState(), async () => {
			const app = await getApp();
			const commands = getCommands(app);
			const apiMiddleware: Middleware = new ApiMiddleware(async (req, res) => {
				const route = options?.plugins?.getRoute(req);
				if (route != null) {
					await loadRouteWorkspacePlugins({
						route,
						app,
						commands,
						props: options.plugins.getProps?.(req),
						clearAllPlugins: serverClearAllPlugins,
						loadPlugins: serverLoadPlugins,
						makePluginReady: serverMakePluginReady,
						getPluginIsReady: serverGetPluginIsReady,
						onPluginLoadError: options.plugins.onPluginLoadError ?? defaultOnPluginLoadError,
						onError: options.plugins.onError ?? defaultOnError,
					});
				}
				await api.bind({ app, commands })(req, res);
			});
			const middlewareChain = [...middlewares, apiMiddleware];
			middlewareChain.forEach((m) => m.init({ app, commands }));
			const middleware: Middleware = middlewareChain.reduceRight((rigth, left) => left.SetNext(rigth));
			await middleware.Process(req, res);
		});
	};
};

export const ApplyPageMiddleware = (
	api: (this: { app: Application; commands: CommandTree }, args: PageMiddlewareArgs) => Promise<unknown>,
	options?: MiddlewareOptions<PageMiddlewareArgs>,
) => {
	return async (args: PageMiddlewareArgs) => {
		return serverPluginStorage.run(createServerPluginState(), async () => {
			const app = await getApp();
			const commands = getCommands(app);
			const route = options?.plugins?.getRoute(args);
			if (route != null) {
				await loadRouteWorkspacePlugins({
					route,
					app,
					commands,
					props: options.plugins.getProps?.(args),
					clearAllPlugins: serverClearAllPlugins,
					loadPlugins: serverLoadPlugins,
					makePluginReady: serverMakePluginReady,
					getPluginIsReady: serverGetPluginIsReady,
					onPluginLoadError: options.plugins.onPluginLoadError ?? defaultOnPluginLoadError,
					onError: options.plugins.onError ?? defaultOnError,
				});
			}
			return await api.bind({ app, commands })(args);
		});
	};
};
