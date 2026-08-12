import { addEvent, Level } from "@ext/loggers/opentelemetry";
import type { PluginProps } from "@gramax/sdk";
import type { Plugin } from "@plugins/api/sdk";
import { getDeps } from "@plugins/api/sdk/core";
import { EsModuleShimsLoader } from "@plugins/core/EsModuleShimsLoader";
import { PluginContainer, ServiceKey } from "@plugins/core/PluginContainer";
import { injectPluginStyles } from "@plugins/core/PluginStyleManager";
import { SdkDependencyLoader } from "@plugins/core/SdkDependencyLoader";
import type { PluginAssetFile, PluginMetadata } from "@plugins/types";

export type RawPluginsType = {
	metadata: PluginMetadata;
	scriptUrl: string;
	locale?: Record<string, Record<string, string>>;
	assets?: PluginAssetFile[];
}[];

type LoadedPlugin = {
	instance: Plugin;
	cleanup: VoidFunction;
};

export class PluginManager {
	private _plugins = new Map<string, LoadedPlugin>();
	private _shimsLoader = new EsModuleShimsLoader();
	readonly container = new PluginContainer();
	private _sdkLoader: SdkDependencyLoader;
	private _pluginProps: PluginProps = {};

	constructor(app?: unknown) {
		this._sdkLoader = new SdkDependencyLoader(this.container, app);
	}

	static async init(plugins: RawPluginsType, props?: PluginProps, app?: unknown): Promise<PluginManager | undefined> {
		if (!plugins || plugins.length === 0) {
			return;
		}
		const manager = new PluginManager(app);

		await manager._shimsLoader.load();
		await manager._sdkLoader.load();

		const pluginProps: PluginProps = props || {};
		manager._pluginProps = pluginProps;
		for (const plugin of plugins) {
			await manager.add(plugin, pluginProps);
		}

		return manager;
	}

	async add(plugin: RawPluginsType[0], props?: PluginProps) {
		const propsToUse = props ?? this._pluginProps;
		let removeStyles: VoidFunction = () => undefined;
		let pluginInstance: Plugin;
		const cleanup = () => {
			removeStyles();
			this._removeContributions(plugin.metadata.id);
		};

		try {
			const PluginClass = await this._shimsLoader.importModule<new (options?: PluginProps) => Plugin>(
				plugin.scriptUrl,
			);
			pluginInstance = new PluginClass(propsToUse);
		} catch (error) {
			cleanup();
			throw error;
		}

		try {
			if (plugin.locale) {
				this.container.get(ServiceKey.Locales).registerLocale(plugin.metadata.id, plugin.locale);
			}

			pluginInstance._setContainer(plugin.metadata.id);
			await Promise.resolve(pluginInstance.onload());
			// Inject styles only after successful onload to avoid a flash from broken plugins
			removeStyles = injectPluginStyles(plugin.metadata.id, plugin.assets);
		} catch (error) {
			cleanup();
			throw error;
		}

		this._plugins.set(plugin.metadata.id, { instance: pluginInstance, cleanup });
	}

	remove(pluginId: string) {
		const loadedPlugin = this._plugins.get(pluginId);
		if (!loadedPlugin) {
			addEvent("plugin-not-loaded", Level.Full, { id: pluginId });
			return;
		}

		loadedPlugin.instance._unload();
		loadedPlugin.cleanup();

		this._plugins.delete(pluginId);
	}

	clear() {
		const pluginIds = Array.from(this._plugins.keys());
		for (const pluginId of pluginIds) {
			const loadedPlugin = this._plugins.get(pluginId);
			if (loadedPlugin) {
				loadedPlugin.instance._unload();
				loadedPlugin.cleanup();
			}
		}

		this._plugins.clear();
		this.container.clear();
	}

	private _removeContributions(pluginId: string): void {
		this.container.get(ServiceKey.Extensions).remove(pluginId);
		this.container.get(ServiceKey.Locales).remove(pluginId);
		this.container.get(ServiceKey.Menus).remove(pluginId);
		getDeps().pluginCommands.remove(pluginId);

		const tokens = this.container.get(ServiceKey.Events).pluginEventTokens.get(pluginId);
		if (tokens) {
			tokens.forEach((token) => this.container.get(ServiceKey.Events).off(token));
			this.container.get(ServiceKey.Events).pluginEventTokens.delete(pluginId);
		}
	}
}
