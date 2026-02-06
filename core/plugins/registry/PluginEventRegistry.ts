import { EventEmitter, EventPlaceholder, UnsubscribeToken } from "@core/Event/EventEmitter";
import type { PluginEventMap } from "@gramax/sdk/events";
import { EventRegistryInterface } from "@plugins/types";

type PluginEvent = PluginEventMap extends EventPlaceholder ? PluginEventMap : EventPlaceholder;

export class PluginEventEmitter extends EventEmitter<PluginEvent> implements EventRegistryInterface {
	pluginEventTokens = new Map<string, UnsubscribeToken[]>();

	registerEvent<E extends keyof PluginEventMap>(pluginId: string, event: E, handler: PluginEventMap[E]) {
		const token = this.on(event, handler);
		if (!this.pluginEventTokens.has(pluginId)) {
			this.pluginEventTokens.set(pluginId, []);
		}
		this.pluginEventTokens.get(pluginId).push(token);
	}
}
