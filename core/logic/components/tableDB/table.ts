import { ItemRef } from "@core/FileStructue/Item/ItemRef";
import t from "@ext/localization/locale/translate";
import type WorkspaceManager from "@ext/workspace/WorkspaceManager";
import yaml from "js-yaml";
import MarkdownParser from "../../../extensions/markdown/core/Parser/Parser";

export type LocalizedString = { [lang: string]: string; default: string };

export interface Table {
	code: string; // system name
	title: LocalizedString;
	description?: LocalizedString;
	subtitle?: string;
	icon?: string;
	fields: Field[];
	tags: string | string[];
}
export interface Field {
	code: string; // system name
	title: LocalizedString;
	description?: LocalizedString;
	sqlType: string;
	default?: string; // default value
	primary?: boolean;
	nullable?: boolean;
	refObject: string; // referenced table
	tags: string | string[];
}

export interface TableWithRefs extends Table {
	refs: { [index: string]: Table };
}

export interface Diagram {
	schema: string;
	tables: TablePosition[];
}
export interface TablePosition {
	name: string;
	position?: string;
	links?: Link[];
}

export interface Link {
	field: string;
	path: string;
}

export class TableDB {
	private _tables: Map<string, Table[]> = new Map();
	private _parseToHtml: (content: string) => Promise<string>;

	constructor(parser: MarkdownParser, private _wm: WorkspaceManager) {
		this._parseToHtml = parser.parseToHtml.bind(parser);
		this._wm.onCatalogChange(this._onChange.bind(this));
	}

	private _onChange(): void {
		this._tables = new Map();
	}

	private async _parseToMd(str: string): Promise<string> {
		return str ? String(await this._parseToHtml(str)) : str;
	}

	private async _parseTableToMd(table: Table): Promise<void> {
		table.subtitle = (await this._parseToMd(table.subtitle)) ?? null;
		for (const lang in table.description) {
			table.description[lang] = await this._parseToMd(table.description[lang]);
		}
		for (const field of table.fields) {
			for (const lang in field.description) {
				field.description[lang] = await this._parseToMd(field.description[lang]);
			}
		}
	}

	private _getRefUID(ref: ItemRef): string {
		return ref.storageId + "@" + ref.path;
	}

	async getTableWithRefs(ref: ItemRef, tableName: string): Promise<TableWithRefs> {
		const tables = await this.getTables(ref);
		const table = tables.find((table) => table.code == tableName);
		if (!table) throw new Error(`${t("diagram.error.tabledb-not-found")}: "${tableName}"`);
		const tableWithRefs: TableWithRefs = { ...table, refs: {} };
		table.fields.forEach((field) => {
			if (field.refObject) {
				tableWithRefs.refs[field.code] = tables.find((table) => table.code == field.refObject);
			}
		});
		return tableWithRefs;
	}

	async getTables(ref: ItemRef): Promise<Table[]> {
		const refUid = this._getRefUID(ref);
		let tables = this._tables.get(refUid);

		if (tables) return tables;
		tables = await this.readSchema(ref);
		for (const table of tables) {
			await this._parseTableToMd(table);
			table.fields.forEach((field) => {
				if (!field.description.default && field.refObject)
					field.description.default = tables.find((table) => table.code == field.refObject)?.subtitle ?? null;
			});
		}
		this._tables.set(refUid, tables);

		return tables;
	}

	async readSchema(ref: ItemRef): Promise<Table[]> {
		const fp = this._wm.current().getFileProvider();
		let content = "";
		try {
			content = await fp.read(ref.path);
		} catch {
			throw new Error(`${t("diagram.error.tabledb-file-not-found")}: "${ref.path}"`);
		}
		const file = yaml.load(content);
		const fields = new Map<string, Field>();
		if (file["$fields"]) {
			let f = file["$fields"];
			if (!Array.isArray(f)) {
				const fields: Field[] = [];
				for (const fkey in f) {
					const field = f[fkey];
					field.code = fkey;
					fields.push(field as Field);
				}
				f = fields;
			}
			f.forEach((field) => {
				this._localize(field);
				fields.set(field.code, field);
			});
		}

		let objects;
		if (!Array.isArray(file)) {
			objects = [];
			for (const key in file as object) {
				const f = file[key];
				f.code = key;
				objects.push(f);
			}
		} else {
			objects = file;
		}
		for (const obj of objects) {
			this._localize(obj);
			if (!Array.isArray(obj.fields)) {
				const fields: Field[] = [];
				for (const fkey in obj.fields) {
					let field = obj.fields[fkey];
					if (!field) field = {};
					field.code = fkey;
					fields.push(field as Field);
				}
				obj.fields = fields;
			}
			obj.fields.forEach((field) => {
				this._localize(field);
				if (fields.has(field.code)) {
					const newField = this._recursiveAssign({}, fields.get(field.code), field);
					Object.keys(newField).map((key) => {
						field[key] = newField[key];
					});
				}
				if (field.nullable == undefined) field.nullable = true;
			});
		}
		return objects;
	}

	private _recursiveAssign(...obj: any[]) {
		function newAssign(obj1: any, obj2: any) {
			const keys = Object.keys(obj2);
			keys.forEach((key) => {
				let value = obj2[key];
				if (value == null || value == undefined) return;
				if (typeof value === "object") {
					value = newAssign({}, value);
					if (Object.keys(value).length) obj1[key] = value;
				} else obj1[key] = value;
			});
			return obj1;
		}
		return obj.reduce((prev, current) => newAssign(prev, current));
	}

	_localize(obj): void {
		const localizedTitle: LocalizedString = { default: null },
			localizedDescription: LocalizedString = { default: null };
		localizedTitle.default = obj.title ?? null;
		localizedDescription.default = obj.description ?? null;
		const titleProp = "title_";
		const descriptionProp = "description_";
		for (const key in obj) {
			if (key.startsWith(titleProp) && key.length == titleProp.length + 2) {
				const lang = key.slice(titleProp.length);
				localizedTitle[lang] = obj[key];
			}
			if (key.startsWith(descriptionProp) && key.length == descriptionProp.length + 2) {
				const lang = key.slice(descriptionProp.length);
				localizedDescription[lang] = obj[key];
			}
		}
		obj.title = localizedTitle;
		obj.description = localizedDescription;
	}

	async readDiagram(ref: ItemRef): Promise<Diagram> {
		const fp = this._wm.current().getFileProvider();
		let file = "";
		try {
			file = await fp.read(ref.path);
		} catch {
			return null;
		}
		const diagram = yaml.load(file) as Diagram;
		let positions;
		if (!Array.isArray(diagram.tables)) {
			positions = [];
			for (const key in diagram.tables as object) {
				const p = (diagram.tables[key] as TablePosition) ?? { name: null };
				p.name = key;
				positions.push(p);
			}
		} else {
			positions = diagram.tables;
		}
		for (const obj of positions) {
			if (!Array.isArray(obj.links)) {
				const links: Link[] = [];
				for (const key in obj.links as object) {
					const link: Link = obj.links[key];
					link.field = key;
					links.push(link);
				}
				obj.links = links;
			}
		}
		diagram.tables = positions;
		return diagram;
	}
}
