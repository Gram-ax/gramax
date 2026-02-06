import Path from "@core/FileProvider/Path/Path";
import SearchArticleContentParserBase from "@ext/serach/modulith/parsing/SearchArticleContentParserBase";
import type { ArticleItem, ArticleTableRow, ArticleTableRowData } from "@ics/gx-vector-search";
import type { JSONContent } from "@tiptap/core";

export default class SearchArticleContentParser extends SearchArticleContentParserBase {
	constructor(
		private readonly _items: JSONContent[],
		private readonly _getSnippetItems: (id: string) => Promise<JSONContent[] | undefined>,
		private readonly _getPropertyValue: (id: string) => string | undefined,
		private readonly _getLinkId: (fileName: Path) => string | undefined,
	) {
		super();
	}

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
			case "paragraph": {
				const buffer = [];

				item.content?.forEach((x) => {
					if (x.type === "text" && x.marks?.length > 0) {
						const filePath = x.marks.find((y) => y.type === "file")?.attrs.resourcePath;
						if (filePath != undefined) {
							this._addText(buffer.join(""));
							buffer.length = 0;

							const fileName = new Path(filePath);
							const link = this._getLinkId(fileName);
							if (link != undefined) {
								this._addItem({
									type: "embedded-link",
									title: x.text ?? "",
									link,
								});

								return;
							}
						}
					}

					const text = this._getText(x);
					buffer.push(text);
				});

				if (buffer.length > 0) {
					this._addText(buffer.join(""));
				}
				break;
			}
			case "heading":
				this._addHeader(item.attrs.level, this._jsonToString(item));
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
					cellItems = await new SearchArticleContentParser(
						cell.content,
						this._getSnippetItems,
						this._getPropertyValue,
						this._getLinkId,
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

	private _jsonToString(json: JSONContent): string {
		return json.content?.map((x) => this._getText(x)).join("") ?? "";
	}

	private _getText(item: JSONContent) {
		return item.type === "inline-property" && item.attrs.bind
			? (this._getPropertyValue(item.attrs.bind) ?? item.text)
			: item.text;
	}
}
