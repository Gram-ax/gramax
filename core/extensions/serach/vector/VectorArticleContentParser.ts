import { ArticleBlock, ArticleItem, ArticleTableRow, ArticleTableRowData } from "@ics/gx-vector-search";
import { JSONContent } from "@tiptap/core";

class HeaderArticleBlock implements ArticleBlock {
	type: "block" = "block" as const;
	items: ArticleItem[] = [];

	constructor(public readonly level: number, public title: string) {}

	toJSON() {
		const { level, ...rest } = this;
		return rest;
	}
}

export default class VectorArticleContentParser {
	private _children: ArticleItem[] = [];
	private _blocksStack: ArticleBlock[] = [];
	private _curBlock: ArticleBlock | undefined;

	constructor(
		private readonly _items: JSONContent[],
		private readonly _getSnippetItems: (id: string) => Promise<JSONContent[] | null>,
		private readonly _getPropertyValue: (id: string) => string | null,
	) {}

	async parse(): Promise<ArticleItem[]> {
		await this._parseItems(this._items);
		return this._children;
	}

	private async _parseItems(items?: JSONContent[]): Promise<void> {
		if (!items) return;

		for (const item of items) {
			await this._parseItem(item);
		}
	}

	private async _parseItem(item: JSONContent): Promise<void> {
		if (!item) return;

		switch (item.type) {
			case "paragraph":
				this._addText(this._jsonToString(item));
				break;
			case "heading":
				this._addHeader(item);
				break;
			case "code_block":
				this._addText(this._jsonToString(item));
				break;
			case "table":
				await this._addTable(item);
				break;
			case "note":
				await this._addNote(item);
				break;
			case "bulletList":
			case "orderedList":
				await this._parseItems(item.content?.flatMap((x) => x.content));
				break;
			case "tab":
				await this._addTab(item);
				break;
			case "snippet":
				await this._addSnippet(item);
				break;
			case "horizontal_rule":
			case "diagrams":
			case "openapi":
			case "blockMd":
			case "image":
			case "video":
			case "view":
			case "html":
				break;
			default:
				await this._parseItems(item.content);
				break;
		}
	}

	private _addHeader(header: JSONContent): void {
		while (this._curBlock instanceof HeaderArticleBlock && this._curBlock.level >= header.attrs.level) {
			this._exitBlock();
		}

		this._enterBlock(new HeaderArticleBlock(header.attrs.level, this._jsonToString(header)));
	}

	private async _addNote(note: JSONContent): Promise<void> {
		this._enterBlock({
			type: "block",
			items: [],
			title: note.attrs.title,
		});

		await this._parseItems(note.content);
		this._exitBlock();
	}

	private async _addTab(tab: JSONContent): Promise<void> {
		this._enterBlock({
			type: "block",
			items: [],
			title: tab.attrs?.name,
		});

		await this._parseItems(tab.content);
		this._exitBlock();
	}

	private async _addSnippet(snippet: JSONContent): Promise<void> {
		if (!snippet.attrs?.id) return;

		const items = await this._getSnippetItems(snippet.attrs.id);
		await this._parseItems(items);
	}

	private async _addTable(table: JSONContent): Promise<void> {
		const rows: ArticleTableRow[] = [];
		for (const row of table.content ?? []) {
			const data: ArticleTableRowData[] = [];
			for (const cell of row.content ?? []) {
				let cellItems: ArticleItem[] = [];
				if (cell.content) {
					cellItems = await new VectorArticleContentParser(
						cell.content,
						this._getSnippetItems,
						this._getPropertyValue,
					).parse();
				}

				data.push({
					items: cellItems,
					colspan: cell.attrs.colspan,
					rowspan: cell.attrs.rowspan,
				});
			}

			rows.push({
				data,
			});
		}

		this._addItem({
			type: "table",
			rows,
		});
	}

	private _addText(text: string) {
		this._addItem({
			type: "text",
			text,
		});
	}

	private _addItem(item: ArticleItem) {
		if (!this._curBlock) {
			this._children.push(item);
		} else {
			this._curBlock.items.push(item);
		}
	}

	private _enterBlock(block: ArticleBlock): void {
		if (this._curBlock) {
			this._blocksStack.push(this._curBlock);
			this._curBlock.items.push(block);
		} else {
			this._children.push(block);
		}

		this._curBlock = block;
	}

	private _exitBlock(): void {
		this._curBlock = this._blocksStack.pop();
	}

	private _jsonToString(json: JSONContent): string {
		return (
			json.content
				?.map((x) =>
					x.type === "inline-property" && x.attrs.bind
						? this._getPropertyValue(x.attrs.bind) ?? x.text
						: x.text,
				)
				.join("") ?? ""
		);
	}
}
