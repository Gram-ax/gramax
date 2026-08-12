import type { PlatformEnvironmentKey } from "@plugins/api/sdk/utilities";
import { pluginValidator } from "@plugins/core/PluginValidator";
import type { PluginConfig, PluginData } from "@plugins/types";

// Node cannot resolve bare @gramax/sdk imports from a data: URL during SSR/plugin loading.
// Subpaths (e.g. @gramax/sdk/events) are intentionally replaced with the same sdk.js URL
// because the SDK is a single bundle that re-exports everything under all subpaths.
const SDK_IMPORT_SPECIFIER = /(["'])@gramax\/sdk(?:\/[^"']*)?\1/g;

const getServerSdkModuleUrl = (): string => {
	const cwd = process.cwd().replace(/\\/g, "/");
	const nextPublicPath = cwd.endsWith("/apps/next")
		? `${cwd}/public/plugins/sdk.js`
		: `${cwd}/apps/next/public/plugins/sdk.js`;
	return encodeURI(`file:///${nextPublicPath}`);
};

const replaceSdkImportsForServer = (script: string): string => {
	const sdkModuleUrl = getServerSdkModuleUrl();
	return script.replace(SDK_IMPORT_SPECIFIER, JSON.stringify(sdkModuleUrl));
};

export const createBlobUrl = (script: string): string => {
	if (typeof window === "undefined") {
		const resolvedScript = replaceSdkImportsForServer(script);
		return `data:text/javascript;charset=utf-8,${encodeURIComponent(resolvedScript)}`;
	}

	const blob = new Blob([script], { type: "application/javascript" });
	return URL.createObjectURL(blob);
};

export const revokeBlobUrl = (blobUrl?: string): void => {
	if (blobUrl?.startsWith("blob:")) {
		URL.revokeObjectURL(blobUrl);
	}
};

export const createPluginData = (pluginRaw: PluginConfig, blobUrl: string): PluginData => ({
	metadata: pluginRaw.metadata,
	script: pluginRaw.script,
	locale: pluginRaw.locale,
	assets: pluginRaw.assets,
	blobUrl,
});

export const createPluginForManager = (pluginData: PluginData) => ({
	metadata: pluginData.metadata,
	scriptUrl: pluginData.blobUrl,
	locale: pluginData.locale,
	assets: pluginData.assets,
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
	revokeBlobUrl(pluginData.blobUrl);
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
