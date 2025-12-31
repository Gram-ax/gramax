import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import { Asset } from "./Asset";

export interface TemplateFile {
	name: string;
	buffer: Buffer;
}

export class TemplateAsset extends Asset {
	private readonly _path: Path;
	private readonly _validExtensions: string[];

	constructor(folderPath: string, fp: FileProvider, validExtensions: string[]) {
		super(fp);
		this._path = new Path(folderPath);
		this._validExtensions = validExtensions;
	}

	async list(): Promise<string[]> {
		const files = await this._listDir(this._path);
		return files.filter((f) => this._isValid(f));
	}

	getContent(name: string): Promise<Buffer | null> {
		return this._readBinary(this._path.join(new Path(name)));
	}

	getContentAsString(name: string): Promise<string | null> {
		return this._read(this._path.join(new Path(name)));
	}

	async add(templates: TemplateFile[]): Promise<void> {
		for (const t of templates) {
			await this._write(this._path.join(new Path(t.name)), t.buffer);
		}
	}

	async delete(names: string[]): Promise<void> {
		await names.mapAsync((n) => this._remove(this._path.join(new Path(n))));
	}

	private _isValid(fileName: string): boolean {
		const dot = fileName.lastIndexOf(".");
		if (dot === -1 || dot === fileName.length - 1) return false;
		const ext = fileName.substring(dot + 1).toLowerCase();
		return this._validExtensions.some((v) => ext.startsWith(v));
	}
}
