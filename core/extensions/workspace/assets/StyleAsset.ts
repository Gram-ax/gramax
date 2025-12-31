import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import { Asset } from "./Asset";

const STYLE_PATH = new Path("style.css");

export class StyleAsset extends Asset {
	constructor(fp: FileProvider) {
		super(fp);
	}

	getContent(): Promise<string | null> {
		return this._read(STYLE_PATH);
	}

	setContent(data: string): Promise<void> {
		return this._write(STYLE_PATH, data);
	}

	delete(): Promise<void> {
		return this._remove(STYLE_PATH);
	}
}
