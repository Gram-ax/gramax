import DiagramType from "@core/components/Diagram/DiagramType";
import UiLanguage from "@ext/localization/core/model/Language";
import t from "@ext/localization/locale/translate";
import {
	SearchArticleContentParserJSONBase,
	type SearchArticleContentParserJSONBaseOptions,
} from "@ext/serach/modulith/parsing/SearchArticleContentParserJSONBase";
import type { ArticleLanguage } from "@ext/serach/modulith/SearchArticle";
import { getLocalizedString } from "@ext/serach/modulith/utils/getLocalizedString";
import type { Table } from "@ext/tableDB/table";
import type {
	ArticleBlock,
	ArticleItem,
	ArticleTableRow,
	ArticleTableRowData,
	ArticleText,
} from "@ics/gx-vector-search";
import type { JSONContent } from "@tiptap/core";
import { SemVer } from "semver";

const REMOTE_VERSION_0_0_7 = new SemVer("0.0.7");

interface LeveledBlock {
	level: number;
	block: ArticleBlock;
}

export interface RemoteSearchArticleContentParserOptions extends SearchArticleContentParserJSONBaseOptions {
	remoteVersion: SemVer;
	lang: ArticleLanguage;
}

export default class RemoteSearchArticleContentParser extends SearchArticleContentParserJSONBase<RemoteSearchArticleContentParserOptions> {
	private _children: ArticleItem[] = [];
	private _curBlock: LeveledBlock | undefined;
	private _blocksStack: LeveledBlock[] = [];

	async parse(): Promise<ArticleItem[]> {
		await this._parseItems(this._options.items);
		return this._children;
	}

	protected _handleHeading(title: string, level: number): void {
		const block = this._getBlock(title);
		while (this._curBlock && this._curBlock.level >= level) {
			this._exitBlock();
		}

		this._enterBlock({
			level,
			block,
		});
	}

	protected async _handleNote(note: JSONContent): Promise<void> {
		this._enterScope(this._getBlock(note.attrs.title));
		await this._parseItems(note.content);
		this._exitScope();
	}

	protected async _handleTab(tab: JSONContent): Promise<void> {
		this._enterScope(this._getBlock(tab.attrs?.name));
		await this._parseItems(tab.content);
		this._exitScope();
	}

	protected _addText(text: string): void {
		this._addItem(this._getTextItem(text));
	}

	protected async _handleTable(table: JSONContent): Promise<void> {
		const rows: ArticleTableRow[] = [];

		for (const row of table.content ?? []) {
			const data: ArticleTableRowData[] = [];
			for (const cell of row.content ?? []) {
				const cellItems = cell.content ? await this._parseCells(cell.content) : [];
				data.push({ items: cellItems, colspan: cell.attrs.colspan, rowspan: cell.attrs.rowspan });
			}
			rows.push({ data });
		}

		this._addItem({ type: "table", rows });
	}

	protected async _handleDiagrams(item: JSONContent): Promise<void> {
		if (item.attrs?.diagramName !== DiagramType.mermaid && item.attrs?.diagramName !== DiagramType["plant-uml"])
			return;

		const definition = await this._resolveDiagramDefinition(item);
		const title = item.attrs?.title != null ? String(item.attrs.title).trim() : "";

		if (this._options.remoteVersion.compare(REMOTE_VERSION_0_0_7) < 0) {
			if (title) this._addText(title);
			if (definition) this._addText(definition);
			return;
		}

		if (!definition) return;
		this._addItem({
			type: "diagram",
			diagramType: item.attrs?.diagramName,
			title,
			items: [this._getTextItem(definition)],
		});
	}

	protected async _handleDrawio(_item: JSONContent): Promise<void> {
		// Drawio diagrams are not indexed for remote search
	}

	protected async _handleBlockMd(item: JSONContent): Promise<void> {
		const tag = item.attrs?.tag?.[0];
		if (!tag) return;

		if (tag.name === "Db-table") {
			this._addDbTable(tag.attributes?.object as Table);
		}
	}

	private _addItem(item: ArticleItem) {
		if (!this._curBlock) {
			this._children.push(item);
		} else {
			this._curBlock.block.items.push(item);
		}
	}

	private _enterScope(block: ArticleBlock): void {
		this._enterBlock({
			level: -1,
			block,
		});
	}

	private _enterBlock(blockWrapper: LeveledBlock): void {
		if (this._curBlock) {
			this._blocksStack.push(this._curBlock);
			this._curBlock.block.items.push(blockWrapper.block);
		} else {
			this._children.push(blockWrapper.block);
		}

		this._curBlock = blockWrapper;
	}

	private _exitScope(): void {
		while (this._curBlock?.level !== -1) {
			this._exitBlock();
		}
	}

	private _exitBlock(): void {
		this._curBlock = this._blocksStack.pop();
	}

	private _getBlock(title: string): ArticleBlock {
		return {
			type: "block",
			title,
			items: [],
		};
	}

	private _addDbTable(object: Table): void {
		if (!object) return;
		this._addText(object.code);
		const title = getLocalizedString(object.title, this._options.lang);
		if (title) this._addText(title);
		const description = getLocalizedString(object.description, this._options.lang);
		if (description) this._addText(description);

		const uiLang = this._options.lang === "ru" ? UiLanguage.ru : UiLanguage.en;

		const headerRow = {
			data: [
				{ items: [this._getTextItem(t("field", uiLang))] },
				{ items: [this._getTextItem(t("type", uiLang))] },
				{ items: [this._getTextItem(t("description", uiLang))] },
			],
		};
		const dataRows = object.fields.map((field) => ({
			data: [
				{ items: [this._getTextItem(field.code)] },
				{ items: [this._getTextItem(field.sqlType)] },
				{
					items: [
						this._getTextItem(
							`${getLocalizedString(field.title, this._options.lang) ?? ""} ${getLocalizedString(field.description, this._options.lang) ?? ""}`,
						),
					],
				},
			],
		}));

		this._addItem({
			type: "table",
			rows: [headerRow, ...dataRows],
		});
	}

	private _getTextItem(text: string): ArticleText {
		return {
			type: "text",
			text: text ?? "",
		};
	}

	private _parseCells(items: JSONContent[]): Promise<ArticleItem[]> {
		return new RemoteSearchArticleContentParser({ ...this._options, items }).parse();
	}
}
