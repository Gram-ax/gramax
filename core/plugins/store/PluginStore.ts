import assert from "assert";
import type { PluginProps } from "@gramax/sdk";
import { PluginManager } from "@plugins/core/PluginManager";
import { pluginValidator } from "@plugins/core/PluginValidator";
import {
	createBlobUrl,
	createPluginData,
	createPluginForManager,
	recreatePluginWithNewBlobUrl,
	updatePluginInList,
	withDisabledMetadata,
	isPluginCompatibleWithPlatform,
} from "@plugins/store/util";
import { PluginConfig, PluginData } from "@plugins/types";
import { create } from "zustand";
import { PlatformServiceNew } from "@core-ui/PlatformService";

export interface PluginStoreType {
	manager: PluginManager | null;
	pluginsData: PluginData[];
	pluginsReady: boolean;
	isLoading: boolean;
	init: (pluginText: PluginConfig[], props?: PluginProps) => Promise<void>;
	clear: () => void;
	remove: (pluginId: string) => void;
	add: (pluginRaw: PluginConfig) => Promise<void>;
	toggle: (pluginId: string, disabled: boolean) => Promise<void>;
}

export const PluginStore = create<PluginStoreType>((set, get) => ({
	manager: null,
	pluginsData: [],
	pluginsReady: false,
	isLoading: false,

	init: async (pluginsRaw, props) => {
		set({ pluginsReady: false, isLoading: true });

		const enabledPluginsRaw = pluginsRaw.filter((p) => !p.metadata.disabled);

		const currentPlatform = PlatformServiceNew.getCurrentPlatform();

		const platformCompatiblePlugins = enabledPluginsRaw.filter((pluginRaw) => {
			const isCompatible = isPluginCompatibleWithPlatform(pluginRaw.metadata, currentPlatform);
			if (!isCompatible) {
				console.log(`Plugin ${pluginRaw.metadata.id} skipped: not compatible with platform ${currentPlatform}`);
			}
			return isCompatible;
		});

		const validatedPlugins = platformCompatiblePlugins.filter((pluginRaw) => {
			const validation = pluginValidator.validateFiles(pluginRaw);
			if (!validation.valid) {
				console.error(`Plugin ${pluginRaw.metadata.id} validation failed:`, validation.errors);
				return false;
			}
			return true;
		});

		const pluginsData: PluginData[] = validatedPlugins.map((pluginRaw) => {
			const blobUrl = createBlobUrl(pluginRaw.script);
			return createPluginData(pluginRaw, blobUrl);
		});

		const pluginsForManager = pluginsData.map(createPluginForManager);

		const manager = await PluginManager.init(pluginsForManager, props);
		set({ pluginsData, pluginsReady: true, manager, isLoading: false });
	},

	clear: () => {
		const { manager, pluginsData } = get();
		manager?.clear();
		pluginsData.forEach((plugin) => URL.revokeObjectURL(plugin.blobUrl));
		set({ pluginsData: [], manager: null });
	},

	remove: (pluginId: string) => {
		const { manager, pluginsData } = get();
		const pluginToRemove = pluginsData.find((p) => p.metadata.id === pluginId);
		if (pluginToRemove) {
			URL.revokeObjectURL(pluginToRemove.blobUrl);
		}
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
		const pluginForManager = createPluginForManager(newPluginData);

		await manager?.add(pluginForManager);

		set({
			pluginsData: [...pluginsData, newPluginData],
		});
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
			console.error(`Cannot enable plugin ${pluginId}: not compatible with platform ${currentPlatform}`);
			return;
		}

		const enabledPluginData = withDisabledMetadata(recreatePluginWithNewBlobUrl(pluginData), false);
		await manager.add(createPluginForManager(enabledPluginData));
		set({ pluginsData: updatePluginInList(pluginsData, pluginId, () => enabledPluginData) });
	},
}));
