import { AsyncLocalStorage } from "node:async_hooks";
import type { PluginProps } from "@gramax/sdk";
import type { PluginManager } from "@plugins/core/PluginManager";
import { initPluginsCore } from "@plugins/store/PluginStore";
import type { PluginConfig } from "@plugins/types";

export interface ServerPluginState {
	manager: PluginManager | null;
	pluginsReady: boolean;
}

export const serverPluginStorage = new AsyncLocalStorage<ServerPluginState>();

export const createServerPluginState = (): ServerPluginState => ({
	manager: null,
	pluginsReady: false,
});

export const getServerStore = (): ServerPluginState | undefined => serverPluginStorage.getStore();

export const serverClearAllPlugins = (): void => {
	const state = getServerStore();
	if (!state) return;
	state.manager?.clear();
	state.manager = null;
	state.pluginsReady = false;
};

export const serverLoadPlugins = async (plugins: PluginConfig[], props?: PluginProps, app?: unknown): Promise<void> => {
	const state = getServerStore();
	if (!state) return;
	const { manager } = await initPluginsCore(plugins, props, app);
	state.manager = manager ?? null;
	state.pluginsReady = true;
};

export const serverMakePluginReady = (): void => {
	const state = getServerStore();
	if (state) state.pluginsReady = true;
};

export const serverGetPluginIsReady = (): boolean => getServerStore()?.pluginsReady ?? false;
