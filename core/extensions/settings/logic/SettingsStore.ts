import type YamlFileConfig from "@core/utils/YamlFileConfig";
import { deleteByPath, getByPath, setByPath } from "./schemaUtils";
import type { StoredSettings } from "./types";

// biome-ignore lint/suspicious/noExplicitAny: generic store for any schema level
type AnyStoredSettings = StoredSettings<any>;

export interface SettingsStore<S = AnyStoredSettings> {
	read(): StoredSettings<S>;
	write(settings: StoredSettings<S>): Promise<void>;
	getKey<V>(key: string): V | undefined;
	setKey<V>(key: string, value: V): Promise<void>;
	deleteKey(key: string): Promise<void>;
}

export class YamlSettingsStore<S = AnyStoredSettings> implements SettingsStore<S> {
	constructor(
		// biome-ignore lint/suspicious/noExplicitAny: YamlFileConfig wraps any config shape
		private _yaml: YamlFileConfig<any>,
		private _settingsKey = "settings",
	) {}

	read(): StoredSettings<S> {
		return (this._yaml.get(this._settingsKey) as StoredSettings<S>) ?? ({} as StoredSettings<S>);
	}

	async write(settings: StoredSettings<S>): Promise<void> {
		this._yaml.set(this._settingsKey, settings);
		await this._yaml.save();
	}

	getKey<V>(key: string): V | undefined {
		return getByPath<V>(this.read() as AnyStoredSettings, key);
	}

	async setKey<V>(key: string, value: V): Promise<void> {
		const settings = this.read() as AnyStoredSettings;
		setByPath(settings, key, value);
		await this.write(settings as StoredSettings<S>);
	}

	async deleteKey(key: string): Promise<void> {
		const settings = this.read() as AnyStoredSettings;
		deleteByPath(settings, key);
		await this.write(settings as StoredSettings<S>);
	}
}
