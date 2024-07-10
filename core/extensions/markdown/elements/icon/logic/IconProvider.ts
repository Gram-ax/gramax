import Path from "@core/FileProvider/Path/Path";
import FileProvider from "@core/FileProvider/model/FileProvider";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import FileStructure from "@core/FileStructue/FileStructure";

const ICONS_FOLDER = ".icons";

export interface IconEditorProps {
	code: string;
	svg?: string;
}

export default class IconProvider {
	private _iconsPath: Path;
	private _cachedIcons = new Map<string, string>();

	constructor(private _fp: FileProvider, private _fs: FileStructure, private _catalog: Catalog) {
		this._iconsPath = new Path([this._catalog.getRootCategoryPath().value, ICONS_FOLDER]);
	}

	async getIconByCode(code: string) {
		try {
			if (this._cachedIcons.has(code)) return this._cachedIcons.get(code);
			const path = this._getIconPath(code);
			const svg = (await this._fp.exists(path)) ? await this._fp.read(path) : null;
			this._cachedIcons.set(code, svg);
			return this._cachedIcons.get(code);
		} catch {}
	}

	private _getIconPath(id: string): Path {
		return this._iconsPath.join(new Path(`${id}.svg`));
	}

	async getIconsList() {
		if (!(await this._fp.exists(this._iconsPath))) return [];
		const entries = (await this._fp.readdir(this._iconsPath)).map((e) => new Path(e));
		const list: IconEditorProps[] = [];
		for (const entry of entries) {
			const code = entry.name;
			const svg = await this.getIconByCode(code);
			list.push({ code, svg });
		}
		return list;
	}
}
