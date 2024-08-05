import Path from "@core/FileProvider/Path/Path";
import type FileProvider from "@core/FileProvider/model/FileProvider";
import mergeObjects from "@core/utils/mergeObjects";
import yaml from "js-yaml";

export default class YamlFileConfig<C extends object> {
	private _config: C;

	private constructor(private _fp: FileProvider, private _path: Path) {}

	static async readFromFile<C extends object>(
		fp: FileProvider,
		path: Path,
		defaultConfig: C = {} as C,
	): Promise<YamlFileConfig<C>> {
		const self = new YamlFileConfig<C>(fp, path);

		self._config = defaultConfig;
		if (await fp.exists(path)) {
			const rawYaml = await fp.read(path);
			self._config = mergeObjects<C>(self._config, yaml.load(rawYaml) as C);
		} else {
			await self.save();
		}

		return self;
	}

	static dummy<C extends object>() {
		const self = new YamlFileConfig<C>(null, null);
		self._config = {} as any;
		return self;
	}

	inner(): Readonly<C> {
		return this._config;
	}

	get<K extends keyof C>(name: K): C[K] {
		return this._config[name];
	}

	set<K extends keyof C>(name: keyof C, value: C[K]) {
		this._config[name] = value;
	}

	update(value: C) {
		this._config = value;
	}

	async save() {
		if (!this._fp) return;
		const rawYaml = yaml.dump(this._config);
		await this._fp.write(this._path, rawYaml);
	}
}
