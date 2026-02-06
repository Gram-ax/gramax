import type { PluginProps } from "@gramax/sdk";
import { Plugin } from "@plugins/api/sdk";
import { EsModuleShimsLoader } from "@plugins/core/EsModuleShimsLoader";
import { PluginContainer, ServiceKey } from "@plugins/core/PluginContainer";
import { SdkDependencyLoader } from "@plugins/core/SdkDependencyLoader";
import { PluginMetadata } from "@plugins/types";

export type RawPluginsType = {
	metadata: PluginMetadata;
	scriptUrl: string;
	locale?: Record<string, Record<string, string>>;
}[];

export class PluginManager {
	private _plugins = new Map<string, Plugin>();
	private _shimsLoader = new EsModuleShimsLoader();
	readonly container = new PluginContainer();
	private _sdkLoader = new SdkDependencyLoader(this.container);
	private _pluginProps: PluginProps = {};

	static async init(plugins: RawPluginsType, props?: PluginProps): Promise<PluginManager> {
		if (!plugins || plugins.length === 0) {
			return;
		}
		const manager = new PluginManager();

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
		const PluginClass = await this._shimsLoader.importModule<new (options?: PluginProps) => Plugin>(
			plugin.scriptUrl,
		);
		const pluginInstance = new PluginClass(propsToUse);

		if (plugin.locale) {
			this.container.get(ServiceKey.Locales).registerLocale(plugin.metadata.id, plugin.locale);
		}

		pluginInstance._setContainer(plugin.metadata.id);
		await Promise.resolve(pluginInstance.onload());

		this._plugins.set(plugin.metadata.id, pluginInstance);
	}

	remove(pluginId: string) {
		const plugin = this._plugins.get(pluginId);
		if (!plugin) {
			console.warn(`Plugin ${pluginId} is not loaded`);
			return;
		}

		plugin.onunload?.();

		this.container.get(ServiceKey.Extensions).remove(pluginId);
		this.container.get(ServiceKey.Locales).remove(pluginId);
		this.container.get(ServiceKey.Menus).remove(pluginId);

		const tokens = this.container.get(ServiceKey.Events).pluginEventTokens.get(pluginId);
		if (tokens) {
			tokens.forEach((token) => this.container.get(ServiceKey.Events).off(token));
			this.container.get(ServiceKey.Events).pluginEventTokens.delete(pluginId);
		}

		this._plugins.delete(pluginId);
	}

	clear() {
		const pluginIds = Array.from(this._plugins.keys());
		for (const pluginId of pluginIds) {
			const plugin = this._plugins.get(pluginId);
			if (plugin) {
				try {
					plugin.onunload?.();
				} catch (error) {
					console.error(`Error unloading plugin:`, error);
				}
			}
		}

		this._plugins.clear();
		this.container.clear();
	}
}
