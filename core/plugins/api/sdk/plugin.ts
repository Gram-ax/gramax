import type { PluginProps, Plugin as PluginSdk } from "@gramax/sdk";
import type { Extension as ExtensionSDK } from "@gramax/sdk/editor";
import type { PluginEventMap, PluginEventName } from "@gramax/sdk/events";
import type { MenuModifier } from "@gramax/sdk/ui";
import { getDeps } from "./core";

export abstract class Plugin implements PluginSdk {
	pluginId: string = "";

	constructor(_options: PluginProps = {}) {}

	abstract onload(): void | Promise<void>;
	onunload(): void {}

	_setContainer(pluginId: string): void {
		this.pluginId = pluginId;
	}

	registerExtension(extension: ExtensionSDK): void {
		getDeps().extensions.registerExtension(this.pluginId, extension);
	}

	registerMenuModifier(modifier: MenuModifier): void {
		getDeps().menus.registerModifier(this.pluginId, modifier);
	}

	addEvent<E extends PluginEventName>(event: E, handler: PluginEventMap[E]): void {
		getDeps().events.registerEvent(this.pluginId, event, handler);
	}
}
