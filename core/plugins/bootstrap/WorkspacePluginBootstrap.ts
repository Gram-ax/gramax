import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import type { PluginProps } from "@gramax/sdk";
import type { PluginConfig } from "@plugins/types";

export interface WorkspacePluginsResponse {
	plugins: PluginConfig[];
	errors: string[];
}

export interface WorkspacePluginBootstrapOptions {
	workspacePath?: WorkspacePath;
	props?: PluginProps;
	app?: unknown;
	force?: boolean;
	skipServerOnly?: boolean;
	getPlugins: (workspacePath?: WorkspacePath) => Promise<WorkspacePluginsResponse>;
	clearAllPlugins: () => void;
	loadPlugins: (plugins: PluginConfig[], props?: PluginProps, app?: unknown) => Promise<void>;
	makePluginReady: () => void;
	getPluginIsReady: () => boolean;
	onPluginLoadError?: (pluginName: string) => void;
	onError?: (error: unknown) => void;
}

interface BootstrapState {
	loadKey?: string;
	promise?: Promise<void>;
	generation: number;
}

const state: BootstrapState = { generation: 0 };

export const resetWorkspacePluginBootstrap = () => {
	state.loadKey = undefined;
	state.promise = undefined;
	state.generation++;
};

const getLoadKey = (workspacePath: WorkspacePath, props?: PluginProps) =>
	JSON.stringify({ workspacePath, props: props ?? {} });

export const ensureWorkspacePluginsLoaded = async ({
	workspacePath,
	props,
	app,
	force,
	skipServerOnly = typeof window !== "undefined",
	getPlugins,
	clearAllPlugins,
	loadPlugins,
	makePluginReady,
	getPluginIsReady,
	onPluginLoadError,
	onError,
}: WorkspacePluginBootstrapOptions) => {
	const isServer = typeof window === "undefined";
	const runWithoutPlugins = () => {
		clearAllPlugins();
		makePluginReady();
	};

	if (!workspacePath) {
		runWithoutPlugins();
		if (!isServer) resetWorkspacePluginBootstrap();
		return;
	}

	const loadKey = getLoadKey(workspacePath, props);

	// On server each request is isolated via AsyncLocalStorage — no global dedup needed.
	if (!isServer && !force && state.loadKey === loadKey && (getPluginIsReady() || state.promise)) {
		return state.promise;
	}

	if (!isServer) state.loadKey = loadKey;

	const doLoad = async () => {
		const gen = state.generation;
		try {
			clearAllPlugins();
			const { plugins, errors } = await getPlugins(workspacePath);

			// Workspace switched while we were fetching — the new load will take over.
			if (!isServer && state.generation !== gen) return;

			for (const pluginName of errors) {
				onPluginLoadError?.(pluginName);
			}

			const pluginsToLoad = skipServerOnly ? plugins.filter((p) => !p.metadata.serverOnly) : plugins;
			await loadPlugins(pluginsToLoad, props, app);
		} catch (error) {
			if (!isServer) state.loadKey = undefined;
			onError?.(error);
			makePluginReady();
		} finally {
			if (!isServer) state.promise = undefined;
		}
	};

	// On server: run directly — the caller's AsyncLocalStorage context scopes the state.
	if (isServer) return doLoad();

	state.promise = doLoad();
	return state.promise;
};
