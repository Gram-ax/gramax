import type { CommandTree } from "@app/commands";
import type Application from "@app/types/Application";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import { addEvent, Level, span } from "@ext/loggers/opentelemetry";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import type { PluginProps } from "@gramax/sdk";
import { clearAllPlugins, getPluginIsReady, loadPlugins, makePluginReady } from "@plugins/store";
import type { PluginConfig } from "@plugins/types";
import { ensureWorkspacePluginsLoaded } from "./WorkspacePluginBootstrap";

export interface RouteWorkspacePluginPreload<TArgs> {
	getRoute: (args: TArgs) => string | undefined;
	getProps?: (args: TArgs) => PluginProps | undefined;
	onPluginLoadError?: (pluginName: string) => void;
	onError?: (error: unknown) => void;
}

export const defaultOnPluginLoadError = (pluginName: string) =>
	addEvent("plugin-load-error", Level.Commands, { name: pluginName });
export const defaultOnError = (error: unknown) => span()?.recordException(error as Error);

interface LoadRouteWorkspacePluginsOptions {
	route: string;
	app: Application;
	commands: CommandTree;
	props?: PluginProps;
	force?: boolean;
	// Override store ops to use server-side ALS state instead of the Zustand default.
	clearAllPlugins?: () => void;
	loadPlugins?: (plugins: PluginConfig[], props?: PluginProps, app?: unknown) => Promise<void>;
	makePluginReady?: () => void;
	getPluginIsReady?: () => boolean;
	onPluginLoadError?: (pluginName: string) => void;
	onError?: (error: unknown) => void;
}

export const resolveRouteWorkspacePath = async (route: string, app: Application): Promise<WorkspacePath> => {
	const { catalogName } = RouterPathProvider.parsePath(route);

	if (catalogName) await app.wm.getCatalogOrFindAtAnyWorkspace(catalogName);
	else await app.wm.currentOrDefault();

	return app.wm.maybeCurrent()?.path();
};

export const loadRouteWorkspacePlugins = async ({
	route,
	app,
	commands,
	props,
	force,
	clearAllPlugins: ClearAllPlugins = clearAllPlugins,
	loadPlugins: LoadPlugins = loadPlugins,
	makePluginReady: MakePluginReady = makePluginReady,
	getPluginIsReady: GetPluginIsReady = getPluginIsReady,
	onPluginLoadError,
	onError,
}: LoadRouteWorkspacePluginsOptions) => {
	const workspacePath = await resolveRouteWorkspacePath(route, app);

	return ensureWorkspacePluginsLoaded({
		workspacePath,
		props: props ?? { gesUrl: app.em.getConfig().gesUrl },
		app,
		force,
		getPlugins: (path) => commands.workspace.assets.plugins.getPlugins.do({ workspacePath: path }),
		clearAllPlugins: ClearAllPlugins,
		loadPlugins: LoadPlugins,
		makePluginReady: MakePluginReady,
		getPluginIsReady: GetPluginIsReady,
		onPluginLoadError,
		onError,
	});
};
