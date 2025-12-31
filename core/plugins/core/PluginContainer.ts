import { PluginLocaleRegistry } from "@plugins/registry";
import { PluginMenuRegistry } from "@plugins/registry/PluginMenuRegistry";
import { PluginEventEmitter } from "@plugins/registry/PluginEventRegistry";
import { PluginExtensionRegistry } from "@plugins/registry/PluginExtensionRegistry";

export enum ServiceKey {
	Extensions = "extensions",
	Locales = "locales",
	Menus = "menus",
	Events = "events",
}

export interface ServiceMap {
	[ServiceKey.Extensions]: PluginExtensionRegistry;
	[ServiceKey.Locales]: PluginLocaleRegistry;
	[ServiceKey.Menus]: PluginMenuRegistry;
	[ServiceKey.Events]: PluginEventEmitter;
}

export class PluginContainer {
	private _extensions = new PluginExtensionRegistry();
	private _locales = new PluginLocaleRegistry();
	private _menus = new PluginMenuRegistry();
	private _events = new PluginEventEmitter();

	get<K extends ServiceKey>(key: K): ServiceMap[K] {
		switch (key) {
			case ServiceKey.Extensions:
				return this._extensions as ServiceMap[K];
			case ServiceKey.Locales:
				return this._locales as ServiceMap[K];
			case ServiceKey.Menus:
				return this._menus as ServiceMap[K];
			case ServiceKey.Events:
				return this._events as ServiceMap[K];
		}
	}

	clear(): void {
		this._extensions = new PluginExtensionRegistry();
		this._locales = new PluginLocaleRegistry();
		this._menus = new PluginMenuRegistry();
		this._events = new PluginEventEmitter();
	}
}
