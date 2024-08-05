import FileProvider from "@core/FileProvider/model/FileProvider";
import { ItemRef } from "@core/FileStructue/Item/ItemRef";
import t from "@ext/localization/locale/translate";
import dagre from "dagre";
import { getLocalizedString } from "../components/libs/utils";
import Path from "../logic/FileProvider/Path/Path";
import ResourceManager from "../logic/Resource/ResourceManager";
import { Field, Link, Table, TableDB } from "../logic/components/tableDB/table";
import SilentError from "@ext/errorHandlers/silent/SilentError";

const style = {
	title: {
		fontSize: 30,
		fontFamily: '"Open Sans", sans-serif',
		padding: {
			top: 20,
			bottom: 20,
		},
		color: "white",
		backgroundColor: "#2d6897",
		position: "middle", // start|end|middle
	},
	field: {
		fontSize: 25,
		fontFamily: '"Open Sans", sans-serif',
		padding: {
			top: 15,
			bottom: 15,
			left: 25,
		},
		color: "black",
		sqlTypeColor: "#b9b9b9",
		backgroundColor: "#f6f6f6",
	},
	line: {
		color: "var(--color-article-text)",
		radius: 30,
		width: 1,
	},
	arrow: {
		angle: 50,
		length: 16,
		color: "var(--color-article-text)",
	},
	notNullable: {
		color: "red",
		fontSize: 25,
	},
};

const arc = style.line.radius;

export default class DbDiagram {
	private tablesSvg: { title: string; fields: string[]; table: Table }[];
	private linksSvg: { link: string; table1Name: string; table2Name: string }[];
	private width: number;
	private height: number;
	constructor(private _tableManager: TableDB, private _fp: FileProvider) {
		this.tablesSvg = [];
		this.linksSvg = [];
		this.width = 0;
		this.height = 0;
	}

	_createArrow(x: number, y: number, leftToRight: boolean): string {
		x = leftToRight ? x + style.arrow.length : x - style.arrow.length;
		const dy = Math.tan((style.arrow.angle / 360) * Math.PI) * style.arrow.length;
		const dx = leftToRight ? -style.arrow.length : style.arrow.length;
		const points = `${x},${y} ${x + dx},${y + dy} ${x + dx},${y - dy}`;
		return `<polyline fill="${style.arrow.color}" points="${points}"/>`;
	}

	_createRect(x: number, y: number, width: number, height: number, color: string): string {
		return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${color}"/>`;
	}

	_createText(
		x: number,
		y: number,
		text: string,
		color: string,
		className: string,
		textAnchor = "start",
		isTitle = false,
		notNullable = false,
	): string {
		return `<text x="${
			textAnchor == "start"
				? x + style.field.padding.left
				: textAnchor == "end"
				? x - style.field.padding.left
				: x
		}" y="${
			y + (isTitle ? style.title.fontSize : style.field.fontSize) - 1
		}" fill="${color}" text-anchor="${textAnchor}" class="${className}">${
			notNullable ? text + `<tspan class="notNullable" fill="${style.notNullable.color}">*</tspan>` : text
		}</text>`;
	}

	_createPath(x1: number, y1: number, x2: number, y2: number, path: number[], x1l: boolean, x2l: boolean): string {
		x2 = x2l ? x2 - style.arrow.length : x2 + style.arrow.length;
		let x = 0,
			y = 0;
		const idxX = [],
			idxY = [];
		if (path.length == 0) {
			let dx = x2 - x1;
			if (x1l == x2l) {
				if (x1l) {
					if (dx < 0) {
						path.push(dx - style.line.radius);
						path.push(y2 - y1);
						path.push(style.line.radius);
						idxX.push(0);
					} else {
						path.push(-style.line.radius);
						path.push(y2 - y1);
						path.push(dx + style.line.radius);
						idxX.push(0);
					}
				} else {
					if (dx < 0) {
						path.push(style.line.radius);
						path.push(y2 - y1);
						path.push(dx - style.line.radius);
						idxX.push(0);
					} else {
						path.push(style.line.radius + dx);
						path.push(y2 - y1);
						path.push(-style.line.radius);
						idxX.push(0);
					}
				}
			} else if ((dx < 0 && x1l) || (dx > 0 && !x1l)) {
				path.push(dx / 2);
				if ((dx > 0 && x2l) || (dx < 0 && !x2l)) {
					path.push(y2 - y1);
					path.push(dx / 2);
					idxX.push(0);
				} else {
					path.push((y2 - y1) / 2);
					path.push(0);
					path.push((y2 - y1) / 2);
					path.push(x2l ? arc : -arc);
				}
			} else {
				path.push(x1l ? -arc : arc);
				dx = dx + (x1l ? -arc : arc);
				if ((dx > 0 && x2l) || (dx < 0 && !x2l)) {
					path.push(y2 - y1);
					path.push(0);
				} else {
					path.push((y2 - y1) / 2);
					path.push(0);
					path.push((y2 - y1) / 2);
					path.push(x2l ? arc : -arc);
				}
			}
		}
		if (path.length == 1) {
			const dx = x2 - x1 - path[0];
			if ((dx > 0 && x2l) || (dx < 0 && !x2l)) {
				path.push(y2 - y1);
				path.push(dx);
				idxX.push(0);
			} else {
				path.push((y2 - y1) / 2);
				path.push(0);
				path.push((y2 - y1) / 2);
				path.push(x2l ? arc : -arc);
			}
		}
		if (path.length % 2 == 0) {
			path.push(x2l ? arc : -arc);
		}
		if (path[0] == 0) {
			path[0] = x1l ? -arc : arc;
		}
		if (path[path.length - 1] == 0) {
			path[path.length - 1] = x2l ? arc : -arc;
		}
		path.forEach((p, idx) => {
			if (p == 0) {
				if (idx % 2 == 0) idxX.push(idx);
				else idxY.push(idx);
			}
			if (idx % 2 == 0) x += p;
			else y += p;
		});
		if (idxX.length == 0) {
			idxX.push(path.length - 1);
			idxY.push(path.length);
			path.splice(path.length - 1, 0, 0, 0);
		}
		if (idxY.length == 0) idxY.push(1);
		const dx = (x2 - x1 - x) / idxX.length;
		const dy = (y2 - y1 - y) / idxY.length;
		idxX.forEach((i) => {
			path[i] += dx;
		});
		idxY.forEach((i) => {
			path[i] += dy;
		});

		let d = `M${x1},${y1}`;
		let arcMinX = 0,
			arcMinY = 0;
		path.forEach((p, idx, arr) => {
			if (idx % 2 == 0) {
				arcMinX = Math.min(arc, Math.min(Math.abs(p) - arcMinY, Math.abs((arr[idx + 1] ?? 0) / 2)));
				if (arcMinX < 0) arcMinX = 0;
				const clockwise = (arr[idx + 1] ?? 0) * p > 0;
				const length = p > 0 ? p - arcMinX - arcMinY : p + arcMinX + arcMinY;
				d +=
					` h${length} a${arcMinX},${arcMinX} 0 0 ${clockwise ? 1 : 0}` +
					` ${p > 0 ? arcMinX : -arcMinX}, ${(arr[idx + 1] ?? 0) > 0 ? arcMinX : -arcMinX}`;
			} else {
				arcMinY = Math.min(
					arc,
					Math.min(
						Math.abs(p) - arcMinX,
						Math.abs(idx == arr.length - 2 ? arr[idx + 1] ?? 0 : (arr[idx + 1] ?? 0) / 2),
					),
				);
				if (arcMinY < 0) arcMinY = 0;
				const clockwise = (arr[idx + 1] ?? 0) * p < 0;
				const length = p > 0 ? p - arcMinX - arcMinY : p + arcMinX + arcMinY;
				d +=
					` v${length} a${arcMinY},${arcMinY} 0 0 ${clockwise ? 1 : 0}` +
					` ${(arr[idx + 1] ?? 0) > 0 ? arcMinY : -arcMinY}, ${p > 0 ? arcMinY : -arcMinY}`;
			}
		});
		return (
			`<path d="${d}" fill="none" stroke="${style.line.color}" stroke-width="${style.line.width}px" />` +
			this._createArrow(x2, y2, x2l) +
			`<path d="${d}" fill="none" stroke="black" opacity="0" stroke-width="30px" />`
		);
	}

	addTable(
		x: number,
		y: number,
		table: Table,
		{ width, height, titleHeight }: { width: number; height: number; titleHeight: number },
		lang: string,
		links?: Link[],
		fields?: Field[],
	) {
		const refInfo: {
			name: string;
			xl: number;
			xr: number;
			pkY: number;
			refs: {
				refTable: string;
				y: number;
				link?: string;
			}[];
		} = {
			name: table.code,
			xl: x,
			xr: x + width,
			pkY: y + titleHeight / 2,
			refs: [],
		};

		const tableSvg: { title: string; fields: string[]; table: Table } = {
			title: "",
			fields: [],
			table,
		};

		// title
		tableSvg.title += `<g><title>${getLocalizedString(table.description, lang) ?? ""}</title>`;
		tableSvg.title += this._createRect(x, y, width, titleHeight, style.title.backgroundColor);
		const titleX =
			style.title.position == "middle" ? x + width / 2 : style.title.position == "start" ? x : x + width;
		tableSvg.title += this._createText(
			titleX,
			y + style.title.padding.top,
			table.code,
			style.title.color,
			"title",
			style.title.position,
			true,
		);
		tableSvg.title += "</g>";

		tableSvg.title += this._createRect(
			x,
			y + titleHeight,
			width,
			height * table.fields.length,
			style.field.backgroundColor,
		);

		// fields
		this.width = Math.max(x + width, this.width);
		this.height = Math.max(y + height * (table.fields.length + 1), this.height);
		table.fields.forEach((field, idx) => {
			let fieldSvg = "";
			fieldSvg += `<g><title>${getLocalizedString(field.description, lang) ?? ""}</title>`;
			fieldSvg += this._createRect(x, y + titleHeight + height * idx, width, height, style.field.backgroundColor);
			const className = field.primary ? "key field" : "field";
			if (field.primary) {
				refInfo.xl = x;
				refInfo.xr = x + width;
				refInfo.pkY = y + height * (idx + 0.5) + titleHeight;
			}
			if (field.refObject) {
				refInfo.refs.push({
					refTable: field.refObject,
					y: y + height * (idx + 0.5) + titleHeight,
					link: links?.find((link) => link.field == field.code)?.path,
				});
			}
			fieldSvg += this._createText(
				x,
				y + height * idx + titleHeight + style.field.padding.top,
				field.code,
				style.field.color,
				className,
				"start",
				false,
				!field.nullable,
			);
			fieldSvg += this._createText(
				x + width,
				y + height * idx + titleHeight + style.field.padding.top,
				field.sqlType ?? "",
				style.field.sqlTypeColor,
				className,
				"end",
			);
			fieldSvg += "</g>";
			tableSvg.fields.push(fieldSvg);
		});
		tableSvg.table.fields = fields;
		this.tablesSvg.push(tableSvg);
		return refInfo;
	}

	_haveTag(tableTags: string | string[], tags: string[]): boolean {
		if (!tableTags) return false;
		const tTags = Array.isArray(tableTags) ? tableTags : tableTags.split(",");
		for (const tableTag of tTags) {
			for (const tag of tags) {
				if (tag == tableTag) {
					return true;
				}
			}
		}
		return false;
	}

	async addDiagram(ref: ItemRef, tags: string, lang: string, rootPath: Path, primary?: string) {
		const resourceManager = new ResourceManager(
			this._fp,
			rootPath.subDirectory(ref.path.parentDirectoryPath),
			rootPath,
		);
		const diagram = await this._tableManager.readDiagram(ref);
		if (!diagram) throw new SilentError(t("diagram.error.cannot-get-data"));

		const tableRef = {
			path: resourceManager.getAbsolutePath(new Path(diagram.schema)),
			storageId: ref.storageId,
		};
		const schema = await this._tableManager.getTables(tableRef);
		const tables: { x: number; y: number; table: Table; links: Link[]; fields: Field[] }[] = [];
		const excludeTags: string[] = [],
			titleTags: string[] = [],
			includeTags: string[] = [];
		tags.split(",").forEach((tag) => {
			if (tag[0] == "-") {
				excludeTags.push(tag.slice(1));
			} else if (tag[0] == "#") {
				titleTags.push(tag.slice(1));
			} else if (tag[0] == "+") {
				includeTags.push(tag.slice(1));
			}
		});
		const tableRefs = new Set();
		const titleTables: { x: number; y: number; table: Table; links: Link[]; fields: Field[] }[] = [];
		diagram.tables.forEach((t) => {
			const positions = t.position?.split(",") ?? ["-1", "-1"];

			let table = schema.find((obj) => {
				return obj.code == t.name;
			});
			if (table) table = Object.assign({}, table);
			if (
				table &&
				!this._haveTag(table.tags, excludeTags) &&
				(includeTags.length == 0 || this._haveTag(table.tags, includeTags))
			) {
				const fields = table.fields;
				if ((primary && table.code != primary) || this._haveTag(table.tags, titleTags)) {
					table.fields = [];
					titleTables.push({
						x: +positions[0],
						y: +positions[1],
						table: table,
						links: t.links,
						fields,
					});
					if (this._haveTag(table.tags, includeTags)) tableRefs.add(table.code);
					return;
				} else {
					table.fields = table.fields.filter(
						(field) =>
							!this._haveTag(field.tags, excludeTags) &&
							(includeTags.length == 0 || this._haveTag(field.tags, includeTags)),
					);
				}
				table.fields.forEach((field) => {
					tableRefs.add(field.refObject);
				});
				tables.push({
					x: +positions[0],
					y: +positions[1],
					table: table,
					links: t.links,
					fields,
				});
			}
		});
		titleTables.forEach((table) => {
			if (tableRefs.has(table.table.code)) tables.push(table);
		});
		this._addTables(tables, lang);
	}

	_getTableSizes(table: Table): { width: number; height: number; titleHeight: number; totalHeight: number } {
		let maxLength = table.code.length + 5;
		let maxNameLength = maxLength / 2;
		let maxTypeLength = maxNameLength;
		table.fields.forEach((field) => {
			const nameLength = (field.code ?? "").length + 1;
			const typeLength = (field.sqlType ?? "").length + 1;
			if (nameLength > maxNameLength) maxNameLength = nameLength;
			if (typeLength > maxTypeLength) maxTypeLength = typeLength;
		});
		maxLength = maxNameLength + maxTypeLength;
		const width = (maxLength * style.field.fontSize) / 1.8 + 2 * style.field.padding.left;
		const height = style.field.fontSize + style.field.padding.bottom + style.field.padding.top;
		const titleHeight = style.title.fontSize + style.title.padding.bottom + style.title.padding.top;
		const totalHeight = table.fields.length * height + titleHeight;
		return { width, height, titleHeight, totalHeight };
	}

	_addTables(tables: { x: number; y: number; table: Table; links: Link[]; fields: Field[] }[], lang: string) {
		const tablesSizes = tables.map((t) => {
			return this._getTableSizes(t.table);
		});

		const g = new dagre.graphlib.Graph();
		g.setGraph({ rankdir: "LR", marginx: 50, marginy: 50 });
		g.setDefaultEdgeLabel(function () {
			return {};
		});
		tables.forEach((t, idx) => {
			g.setNode(t.table.code, {
				width: tablesSizes[idx].width,
				height: tablesSizes[idx].totalHeight,
			});
			t.table.fields.forEach((f, idx) => {
				if (f.refObject && tables.some((t) => t.table.code == f.refObject))
					idx % 2 == 0 ? g.setEdge(t.table.code, f.refObject) : g.setEdge(f.refObject, t.table.code);
			});
		});
		dagre.layout(g);
		g.nodes().forEach((node, idx) => {
			if (tables[idx]) {
				if (tables[idx].x < 0) tables[idx].x = g.node(node).x - tablesSizes[idx].width / 2;
				if (tables[idx].y < 0) tables[idx].y = g.node(node).y - tablesSizes[idx].totalHeight / 2;
			}
		});

		const refInfos = tables.map((t, idx) => {
			return this.addTable(+t.x, +t.y, t.table, tablesSizes[idx], lang, t.links, t.fields);
		});
		refInfos.forEach((info) => {
			info.refs.forEach((ref) => {
				const refTableInfo = refInfos.find((i) => i.name == ref.refTable);
				if (refTableInfo) {
					let pathNum: number[] = [];
					if (ref.link) {
						const path = ref.link.split(",");
						pathNum = path.map((p) => {
							return p == "*" || p == "" ? 0 : +p;
						});
					}
					let x1: number, x2: number;
					let x1l: boolean, x2l: boolean;
					if (pathNum.length > 0) {
						if (pathNum[0] > 0) {
							x1 = info.xr;
							x1l = false;
						} else if (pathNum[0] == 0) {
							if (Math.abs(refTableInfo.xl - info.xl) < Math.abs(refTableInfo.xl - info.xr)) {
								x1 = info.xl;
								x1l = true;
							} else {
								x1 = info.xr;
								x1l = false;
							}
						} else {
							x1 = info.xl;
							x1l = true;
						}
						if (pathNum.length % 2 == 1 && pathNum.length != 1 && pathNum[pathNum.length - 1] != 0) {
							if (pathNum[pathNum.length - 1] > 0) {
								x2 = refTableInfo.xl;
								x2l = true;
							} else {
								x2 = refTableInfo.xr;
								x2l = false;
							}
						} else {
							if (Math.abs(refTableInfo.xl - x1) < Math.abs(refTableInfo.xr - x1)) {
								x2 = refTableInfo.xl;
								x2l = true;
							} else {
								x2 = refTableInfo.xr;
								x2l = false;
							}
						}
					} else {
						if (Math.abs(refTableInfo.xl - info.xl) < Math.abs(refTableInfo.xr - info.xl)) {
							x2 = refTableInfo.xl;
							x2l = true;
						} else {
							x2 = refTableInfo.xr;
							x2l = false;
						}
						if (Math.abs(x2 - info.xl) < Math.abs(x2 - info.xr)) {
							x1 = info.xl;
							x1l = true;
						} else {
							x1 = info.xr;
							x1l = false;
						}
					}
					this.linksSvg.push({
						link: this._createPath(x1, ref.y, x2, refTableInfo.pkY, pathNum, x1l, x2l),
						table1Name: info.name,
						table2Name: ref.refTable,
					});
				}
			});
		});
	}

	draw(): string {
		const svg = `
<svg viewBox="0 0 ${this.width + 100} ${this.height + 100}" fill="none" xmlns="http://www.w3.org/2000/svg">
	<defs>
		<style>
			.title { font: bold ${style.title.fontSize}px ${style.title.fontFamily} }
			.field { font: ${style.field.fontSize}px ${style.field.fontFamily} }
			.key { font-weight: bold }
			.notNullable { font: ${style.notNullable.fontSize}px "Open Sans", sans-serif;}
		</style>
	</defs>
	${this.linksSvg.map((l) => l.link).join() + this.tablesSvg.map((table) => table.title + table.fields.join()).join()}
</svg>`;
		return svg;
	}

	getSvg() {
		return `
		<svg viewBox="0 0 ${this.width + 100} ${this.height + 100}" fill="none" xmlns="http://www.w3.org/2000/svg">
			${this.linksSvg.map((l) => l.link).join() + this.tablesSvg.map((table) => table.title + table.fields.join()).join()}
		</svg>`;
	}

	getData() {
		return { tables: this.tablesSvg, links: this.linksSvg, width: this.width, height: this.height };
	}
}
