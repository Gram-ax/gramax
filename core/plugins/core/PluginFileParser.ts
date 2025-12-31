import assert from "assert";
import { PluginConfig, PluginMetadata } from "@plugins/types";

export const PLUGIN_FILE_NAMES = {
	metadata: "_metadata.json",
	script: (pluginId: string) => `${pluginId}.js`,
	locale: "locale.json",
};

export class PluginFileParser {
	static async parseFromFiles(files: File[]): Promise<PluginConfig> {
		const manifestFile = files.find((f) => f.webkitRelativePath.endsWith("/manifest.json"));
		assert(manifestFile, "No manifest.json file found in plugin folder");
		const manifestContent = await manifestFile.text();
		const manifest = JSON.parse(manifestContent);

		const scriptFile = files.find((f) => f.name.endsWith(".js"));
		assert(scriptFile, "No JavaScript file found in plugin folder");
		const script = await scriptFile.text();

		const localeFile = files.find((f) => f.webkitRelativePath.endsWith("/locale.json"));
		let locale: Record<string, Record<string, string>> | undefined;
		if (localeFile) {
			const localeContent = await localeFile.text();
			locale = JSON.parse(localeContent);
		}

		return {
			metadata: {
				...manifest,
				disabled: false,
			},
			script,
			locale,
		};
	}

	static parseMetadata(metadataContent: string): PluginMetadata {
		const metadata = JSON.parse(metadataContent);
		return {
			...metadata,
			disabled: metadata.disabled ?? false,
		} as PluginMetadata;
	}

	static parseLocale(localeContent: string): Record<string, Record<string, string>> {
		return JSON.parse(localeContent);
	}

	static getPluginFilePaths(pluginId: string) {
		return {
			metadata: PLUGIN_FILE_NAMES.metadata,
			script: PLUGIN_FILE_NAMES.script(pluginId),
			locale: PLUGIN_FILE_NAMES.locale,
		};
	}
}
