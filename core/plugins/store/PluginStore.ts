import { PlatformServiceNew } from "@core-ui/PlatformService";
import { addEvent, Level } from "@ext/loggers/opentelemetry";
import type { PluginProps } from "@gramax/sdk";
import { PluginManager } from "@plugins/core/PluginManager";
import { pluginValidator } from "@plugins/core/PluginValidator";
import {
	createBlobUrl,
	createPluginData,
	createPluginForManager,
	isPluginCompatibleWithPlatform,
	recreatePluginWithNewBlobUrl,
	revokeBlobUrl,
	updatePluginInList,
	withDisabledMetadata,
} from "@plugins/store/util";
import type { PluginConfig, PluginData } from "@plugins/types";
import assert from "assert";
import { create } from "zustand";

export interface PluginStoreType {
	manager: PluginManager | null;
	pluginsData: PluginData[];
	pluginsReady: boolean;
	isLoading: boolean;
	init: (pluginText: PluginConfig[], props?: PluginProps, app?: unknown) => Promise<void>;
	clear: () => void;
	remove: (pluginId: string) => void;
	add: (pluginRaw: PluginConfig) => Promise<void>;
	toggle: (pluginId: string, disabled: boolean) => Promise<void>;
}

export const initPluginsCore = async (
	pluginsRaw: PluginConfig[],
	props?: PluginProps,
	app?: unknown,
): Promise<{ pluginsData: PluginData[]; manager: PluginManager | undefined }> => {
	const enabled = pluginsRaw.filter((p) => !p.metadata.disabled);
	const currentPlatform = PlatformServiceNew.getCurrentPlatform();
	const compatible = enabled.filter((p) => {
		const ok = isPluginCompatibleWithPlatform(p.metadata, currentPlatform);
		if (!ok) addEvent("plugin-skipped-platform", Level.Full, { id: p.metadata.id, platform: currentPlatform });
		return ok;
	});
	const valid = compatible.filter((p) => {
		const v = pluginValidator.validateFiles(p);
		if (!v.valid)
			addEvent("plugin-validation-failed", Level.Commands, { id: p.metadata.id, errors: v.errors.join(", ") });
		return v.valid;
	});
	const pluginsData = valid.map((p) => createPluginData(p, createBlobUrl(p.script)));
	const manager = await PluginManager.init(pluginsData.map(createPluginForManager), props, app);
	return { pluginsData, manager };
};

export const PluginStore = create<PluginStoreType>((set, get) => ({
	manager: null,
	pluginsData: [],
	pluginsReady: false,
	isLoading: false,

	init: async (pluginsRaw, props, app) => {
		set({ pluginsReady: false, isLoading: true });
		const { pluginsData, manager } = await initPluginsCore(pluginsRaw, props, app);
		set({ pluginsData, pluginsReady: true, manager: manager ?? null, isLoading: false });
	},

	clear: () => {
		const { manager, pluginsData } = get();
		manager?.clear();
		pluginsData.forEach((plugin) => revokeBlobUrl(plugin.blobUrl));
		set({ pluginsData: [], manager: null });
	},

	remove: (pluginId: string) => {
		const { manager, pluginsData } = get();
		const pluginToRemove = pluginsData.find((p) => p.metadata.id === pluginId);
		if (pluginToRemove) revokeBlobUrl(pluginToRemove.blobUrl);
		set({ pluginsData: pluginsData.filter((p) => p.metadata.id !== pluginId) });
		manager?.remove(pluginId);
	},

	add: async (pluginRaw: PluginConfig) => {
		const { manager, pluginsData } = get();
		const currentPlatform = PlatformServiceNew.getCurrentPlatform();
		assert(
			isPluginCompatibleWithPlatform(pluginRaw.metadata, currentPlatform),
			`Plugin ${pluginRaw.metadata.id} is not compatible with platform ${currentPlatform}`,
		);
		const validation = pluginValidator.validateFiles(pluginRaw);
		assert(validation.valid, `Plugin validation failed: ${validation.errors.join(", ")}`);
		const blobUrl = createBlobUrl(pluginRaw.script);
		const newPluginData = createPluginData(pluginRaw, blobUrl);
		await manager?.add(createPluginForManager(newPluginData));
		set({ pluginsData: [...pluginsData, newPluginData] });
	},

	toggle: async (pluginId: string, disabled: boolean) => {
		const { manager, pluginsData } = get();
		if (!manager) return;
		const pluginData = pluginsData.find((p) => p.metadata.id === pluginId);
		if (!pluginData) return;

		if (disabled) {
			manager.remove(pluginId);
			set({ pluginsData: updatePluginInList(pluginsData, pluginId, (p) => withDisabledMetadata(p, true)) });
			return;
		}

		const currentPlatform = PlatformServiceNew.getCurrentPlatform();
		if (!isPluginCompatibleWithPlatform(pluginData.metadata, currentPlatform)) {
			addEvent("plugin-toggle-incompatible-platform", Level.Full, { id: pluginId, platform: currentPlatform });
			return;
		}

		const enabledPluginData = withDisabledMetadata(recreatePluginWithNewBlobUrl(pluginData), false);
		await manager.add(createPluginForManager(enabledPluginData));
		set({ pluginsData: updatePluginInList(pluginsData, pluginId, () => enabledPluginData) });
	},
}));
