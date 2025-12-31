import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import Theme from "@ext/Theme/Theme";
import { Asset } from "./Asset";

const LOGO_PATHS = {
	[Theme.light]: new Path("home_logo_light.svg"),
	[Theme.dark]: new Path("home_logo_dark.svg"),
} as const;

export class LogoAsset extends Asset {
	constructor(fp: FileProvider) {
		super(fp);
	}

	get(theme: Theme): Promise<string | null> {
		return this._read(LOGO_PATHS[theme]);
	}

	set(theme: Theme, data: string | Buffer): Promise<void> {
		return this._write(LOGO_PATHS[theme], data);
	}

	delete(theme: Theme): Promise<void> {
		return this._remove(LOGO_PATHS[theme]);
	}

	async getAll(): Promise<{ light: string | null; dark: string | null }> {
		const [light, dark] = await Promise.all([this.get(Theme.light), this.get(Theme.dark)]);
		return { light, dark };
	}
}
