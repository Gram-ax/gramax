import type { PluginAssetFile, PluginConfig, PluginMetadata } from "@plugins/types";
import assert from "assert";

export const PLUGIN_FILE_NAMES = {
	metadata: "_metadata.json",
	script: (pluginId: string) => `${pluginId}.js`,
	locale: "locale.json",
	assets: "assets",
};

const STYLE_MIME_TYPE = "text/css" as const;

// biome-ignore lint/complexity/noStaticOnlyClass: consistent API surface with services/core/Utils/PluginFileParser
export class PluginFileParser {
	static async parseFromFiles(files: File[]): Promise<PluginConfig> {
		const manifestFile = files.find((f) => f.webkitRelativePath.endsWith("/manifest.json"));
		assert(manifestFile, "No manifest.json file found in plugin folder");
		const manifestContent = await manifestFile.text();
		const manifest = JSON.parse(manifestContent);
		const stylePaths = this._getStylePaths(manifest.styles);

		const scriptFile = files.find((f) => f.name.endsWith(".js"));
		assert(scriptFile, "No JavaScript file found in plugin folder");
		const script = await scriptFile.text();

		const localeFile = files.find((f) => f.webkitRelativePath.endsWith("/locale.json"));
		let locale: Record<string, Record<string, string>> | undefined;
		if (localeFile) {
			const localeContent = await localeFile.text();
			locale = JSON.parse(localeContent);
		}

		const assets: PluginAssetFile[] = [];
		for (const stylePath of stylePaths) {
			const styleFile = this._findUploadedFile(files, stylePath);
			assert(styleFile, `No CSS file found for plugin style: ${stylePath}`);
			assets.push({
				path: stylePath,
				kind: "style",
				mimeType: STYLE_MIME_TYPE,
				content: await styleFile.text(),
			});
		}

		return {
			metadata: {
				...manifest,
				styles: stylePaths.length ? stylePaths : undefined,
				disabled: false,
			},
			script,
			locale,
			assets: assets.length ? assets : undefined,
		};
	}

	static parseMetadata(metadataContent: string): PluginMetadata {
		const metadata = JSON.parse(metadataContent);
		const styles = this._getStylePaths(metadata.styles);
		return {
			...metadata,
			styles: styles.length ? styles : undefined,
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
			assets: PLUGIN_FILE_NAMES.assets,
		};
	}

	static getStylePaths(metadata: Pick<PluginMetadata, "styles">): string[] {
		return this._getStylePaths(metadata.styles);
	}

	static getAssetStoragePath(asset: Pick<PluginAssetFile, "path">): string {
		return this._getPackagedAssetPath(asset.path);
	}

	private static _normalizeAssetPath(assetPath: string): string {
		return assetPath.replace(/\\/g, "/").replace(/^\.\/+/, "");
	}

	private static _getPackagedAssetPath(assetPath: string): string {
		const normalizedPath = this._normalizeAssetPath(assetPath);
		return normalizedPath.startsWith(`${PLUGIN_FILE_NAMES.assets}/`)
			? normalizedPath
			: `${PLUGIN_FILE_NAMES.assets}/${normalizedPath}`;
	}

	private static _getStylePaths(styles: unknown): string[] {
		if (!styles) return [];
		assert(Array.isArray(styles), "manifest.styles must be an array of CSS file paths");

		return styles.map((stylePath) => {
			assert(typeof stylePath === "string" && stylePath.trim(), "manifest.styles must contain non-empty strings");

			const normalizedPath = this._normalizeAssetPath(stylePath.trim());
			assert(!normalizedPath.startsWith("/"), `Plugin style path must be relative: ${stylePath}`);
			assert(
				normalizedPath !== ".." && !normalizedPath.startsWith("../") && !normalizedPath.includes("/../"),
				`Plugin style path must stay inside the plugin folder: ${stylePath}`,
			);
			assert(normalizedPath.endsWith(".css"), `Plugin style path must point to a CSS file: ${stylePath}`);

			return normalizedPath;
		});
	}

	private static _findUploadedFile(files: File[], assetPath: string): File | undefined {
		const normalizedAssetPath = this._normalizeAssetPath(assetPath);
		return files.find((file) => {
			const uploadedPath = this._normalizeAssetPath(file.webkitRelativePath || file.name);
			return uploadedPath === normalizedAssetPath || uploadedPath.endsWith(`/${normalizedAssetPath}`);
		});
	}
}
