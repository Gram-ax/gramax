import type { PlatformEnvironmentKey } from "@plugins/api/sdk/utilities";
import { pluginValidator } from "@plugins/core/PluginValidator";
import { PluginConfig, PluginData } from "@plugins/types";

export const createBlobUrl = (script: string): string => {
	const blob = new Blob([script], { type: "application/javascript" });
	return URL.createObjectURL(blob);
};

export const createPluginData = (pluginRaw: PluginConfig, blobUrl: string): PluginData => ({
	metadata: pluginRaw.metadata,
	script: pluginRaw.script,
	locale: pluginRaw.locale,
	blobUrl,
});

export const createPluginForManager = (pluginData: PluginData) => ({
	metadata: pluginData.metadata,
	scriptUrl: pluginData.blobUrl,
	locale: pluginData.locale,
});

export const updatePluginInList = (
	pluginsData: PluginData[],
	pluginId: string,
	updater: (plugin: PluginData) => PluginData,
): PluginData[] => pluginsData.map((p) => (p.metadata.id === pluginId ? updater(p) : p));

export const withDisabledMetadata = (pluginData: PluginData, disabled: boolean): PluginData => ({
	...pluginData,
	metadata: { ...pluginData.metadata, disabled },
});

export const recreatePluginWithNewBlobUrl = (pluginData: PluginData): PluginData => {
	if (pluginData.blobUrl) {
		URL.revokeObjectURL(pluginData.blobUrl);
	}
	return {
		...pluginData,
		blobUrl: createBlobUrl(pluginData.script),
	};
};

export const isPluginCompatibleWithPlatform = (
	metadata: PluginData["metadata"],
	currentPlatform: PlatformEnvironmentKey,
): boolean => {
	return pluginValidator.validatePlatform(metadata, currentPlatform);
};
