import SearchArticleContentParserBase from "@ext/serach/modulith/parsing/SearchArticleContentParserBase";
import { ArticleItem, ArticleTableRow, ArticleTableRowData } from "@ics/gx-vector-search";

export default class SearchArticleContentParserHTML extends SearchArticleContentParserBase {
	constructor(private readonly _items: NodeList) {
		super();
	}

	async parse(): Promise<ArticleItem[]> {
		await this._parseItems(this._items);
		return this._children;
	}

	private async _parseItems(items?: NodeList): Promise<void> {
		if (!items) return;

		for (const item of items) {
			await this._parseItem(item);
		}
	}

	private async _parseItem(item: Node): Promise<void> {
		if (!item) return;

		const tag = item.nodeName?.toLowerCase();
		if (/^h[1-6]$/.test(tag)) {
			this._addHeader(parseInt(tag[1]), item.textContent.trim());
		}
		switch (tag) {
			case "p":
			case "strong":
				this._addText(item.textContent.trim());
				break;
			case "li":
				this._addText(item.textContent.trim());
				this._addText("\n");
				break;
			case "ol":
				await this._parseItems(item.childNodes);
				break;
			case "table":
				await this._addTable(item);
				break;
			default:
				await this._parseItems(item.childNodes);
				break;
		}
	}

	private async _addTable(table: Node): Promise<void> {
		const rows: ArticleTableRow[] = [];
		for (const row of table.childNodes ?? []) {
			const data: ArticleTableRowData[] = [];
			for (const cell of row.childNodes ?? []) {
				let cellItems: ArticleItem[] = [];
				if (cell.childNodes) {
					cellItems = await new SearchArticleContentParserHTML(cell.childNodes).parse();
				}

				const cs = (cell as Element).attributes?.getNamedItem("colspan")?.value;
				const rs = (cell as Element).attributes?.getNamedItem("rowspan")?.value;

				data.push({
					items: cellItems,
					colspan: cs ? parseInt(cs) : undefined,
					rowspan: rs ? parseInt(rs) : undefined,
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
}
