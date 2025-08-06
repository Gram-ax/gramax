import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";

export enum PredefinedAssets {
	customStyle = "style.css",
	lightHomeIcon = "home_logo_light.svg",
	darkHomeIcon = "home_logo_dark.svg",
}

export const WORD_TEMPLATES_DIR = "word";

export default class WorkspaceAssets {
	constructor(private readonly _fp: FileProvider) {}

	async get(name: PredefinedAssets): Promise<string> {
		const status = await this._fp.exists(new Path(name));
		if (!status) return null;

		return await this._fp.read(new Path(name)).catch(() => null);
	}

	async getBuffer(name: string): Promise<Buffer> {
		const status = await this._fp.exists(new Path(name));
		if (!status) return null;
		return await this._fp.readAsBinary(new Path(name)).catch(() => null);
	}

	async listFiles(name: PredefinedAssets | string): Promise<string[]> {
		const status = await this._fp.exists(new Path(name));
		if (!status) return [];
		return await this._fp.readdir(new Path(name)).catch(() => []);
	}

	async write(name: PredefinedAssets | string, data: string | Buffer) {
		await this._fp.createRootPathIfNeed();
		await this._fp.write(new Path(name), data);
	}

	async delete(name: PredefinedAssets | string) {
		return this._fp.delete(new Path(name));
	}
}
