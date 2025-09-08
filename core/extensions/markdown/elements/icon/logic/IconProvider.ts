import Path from "@core/FileProvider/Path/Path";
import FileProvider from "@core/FileProvider/model/FileProvider";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import FileStructure from "@core/FileStructue/FileStructure";
import { uniqueName } from "@core/utils/uniqueName";

const ICONS_FOLDER = ".icons";
const ALLOWED_EXTENSIONS = ["svg"];

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

	getIconsPaths() {
		return Array.from(this._cachedIcons.entries())
			.filter(([, value]) => value != null)
			.map(([code]) => this._getIconPath(code));
	}

	private _getIconPath(code: string) {
		return this._iconsPath.join(new Path(`${code}.svg`));
	}

	async getIconsList() {
		if (!(await this._fp.exists(this._iconsPath))) return [];
		const entries = (await this._fp.readdir(this._iconsPath)).map((e) => new Path(e));
		const list: IconEditorProps[] = [];
		for (const entry of entries) {
			const code = entry.name;
			if (!ALLOWED_EXTENSIONS.includes(entry.extension)) continue;
			const svg = await this.getIconByCode(code);
			list.push({ code, svg });
		}
		return list;
	}

	async create(iconEditorProps: IconEditorProps) {
		const { code, svg } = iconEditorProps;
		const icons = await this.getIconsList();

		const existingIcon = icons.find((i) => i.svg === svg);
		if (existingIcon) return existingIcon.code;

		const iconNames = icons.map((i) => i.code);
		const iconName = uniqueName(code, iconNames);
		await this._fp.write(this._getIconPath(iconName), svg);

		this._cachedIcons.set(code, svg);
		return iconName;
	}
}
