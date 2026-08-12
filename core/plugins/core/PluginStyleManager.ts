import type { PluginAssetFile } from "@plugins/types";

export const injectPluginStyles = (pluginId: string, assets?: PluginAssetFile[]): VoidFunction => {
	if (typeof document === "undefined") return () => undefined;

	const styleAssets = assets?.filter((asset) => asset.kind === "style") ?? [];
	if (!styleAssets.length) return () => undefined;

	const elements = styleAssets.map((asset) => {
		const style = document.createElement("style");
		style.type = asset.mimeType;
		style.dataset.gramaxPluginId = pluginId;
		style.dataset.gramaxPluginAsset = asset.path;
		style.textContent = asset.content;
		document.head.appendChild(style);
		return style;
	});

	return () => {
		elements.forEach((element) => element.remove());
	};
};
