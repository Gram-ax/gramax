import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import { PluginFileParser } from "@plugins/core/PluginFileParser";
import type { PluginConfig, PluginMetadata } from "@plugins/types";
import { Asset } from "./Asset";

const PLUGINS_PATH = new Path("plugins");

export interface PluginFiles {
	path: string;
	content: string;
}

export interface PluginReadResult {
	metadata: PluginMetadata;
	script: string;
	locale?: Record<string, Record<string, string>>;
}

export interface PluginsListResult {
	plugins: PluginReadResult[];
	errors: string[];
}

export class PluginsAsset extends Asset {
	constructor(fp: FileProvider) {
		super(fp);
	}

	listIds(): Promise<string[]> {
		return this._listDir(PLUGINS_PATH);
	}

	async getAll(): Promise<PluginsListResult> {
		const ids = await this.listIds();
		const result: PluginsListResult = { plugins: [], errors: [] };

		for (const id of ids) {
			try {
				const plugin = await this.get(id);
				if (plugin) result.plugins.push(plugin);
				else result.errors.push(id);
			} catch {
				result.errors.push(id);
			}
		}
		return result;
	}

	async get(pluginId: string): Promise<PluginReadResult | null> {
		const folder = PLUGINS_PATH.join(new Path(pluginId));
		if (!(await this._exists(folder))) return null;

		const files = await this._readFolder(folder);
		const paths = PluginFileParser.getPluginFilePaths(pluginId);

		let metadata: string | null = null;
		let script: string | null = null;
		let locale: string | null = null;

		for (const f of files) {
			if (f.path === paths.metadata) metadata = f.content;
			else if (f.path === paths.script) script = f.content;
			else if (f.path === paths.locale) locale = f.content;
		}

		if (!metadata || !script) return null;

		return {
			metadata: PluginFileParser.parseMetadata(metadata),
			script,
			locale: locale ? PluginFileParser.parseLocale(locale) : undefined,
		};
	}

	async add(pluginId: string, files: PluginFiles[]): Promise<void> {
		const folder = PLUGINS_PATH.join(new Path(pluginId));
		for (const f of files) {
			await this._write(folder.join(new Path(f.path)), f.content);
		}
	}

	async addFromConfig(plugin: PluginConfig): Promise<void> {
		const paths = PluginFileParser.getPluginFilePaths(plugin.metadata.id);
		const files: PluginFiles[] = [
			{ path: paths.metadata, content: JSON.stringify(plugin.metadata, null, 2) },
			{ path: paths.script, content: plugin.script },
		];
		if (plugin.locale) {
			files.push({ path: paths.locale, content: JSON.stringify(plugin.locale, null, 2) });
		}
		await this.add(plugin.metadata.id, files);
	}

	delete(pluginId: string): Promise<void> {
		return this._remove(PLUGINS_PATH.join(new Path(pluginId)));
	}

	async sync(plugins: PluginConfig[]): Promise<void> {
		const existing = new Set(await this.listIds());
		const newIds = new Set(plugins.map((p) => p.metadata.id));

		for (const id of existing) {
			if (!newIds.has(id)) await this.delete(id);
		}
		await plugins.forEachAsync(async (plugin) => {
			await this.addFromConfig(plugin);
		});
	}
	private async _readFolder(folder: Path): Promise<{ path: string; content: string }[]> {
		const names = await this._fp.readdir(folder);
		const results: { path: string; content: string }[] = [];
		for (const name of names) {
			try {
				const content = await this._fp.read(folder.join(new Path(name)));
				results.push({ path: name, content });
			} catch {}
		}
		return results;
	}
}
