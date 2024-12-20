import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";

export enum PredefinedAssets {
	customStyle = "style.css",
	lightHomeIcon = "home_logo_light.svg",
	darkHomeIcon = "home_logo_dark.svg",
}

export default class WorkspaceAssets {
	constructor(private readonly _fp: FileProvider) {}

	async get(name: PredefinedAssets | string) {
		const status = await this._fp.exists(new Path(name));
		if (!status) return null;

		return await this._fp.read(new Path(name)).catch(() => null);
	}

	async write(name: PredefinedAssets | string, data: string) {
		await this._fp.createRootPathIfNeed();
		await this._fp.write(new Path(name), data);
	}

	async delete(name: PredefinedAssets | string) {
		return this._fp.delete(new Path(name));
	}
}
