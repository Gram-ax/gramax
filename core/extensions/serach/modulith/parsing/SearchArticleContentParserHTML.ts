import type { ArticleId, ArticleItems } from "@ics/article-search/article";
import { ArticleItemCollector } from "@ics/article-search/article";

export default class SearchArticleContentParserHTML {
	private readonly _collector: ArticleItemCollector<never>;

	constructor(
		articleId: ArticleId,
		title: string,
		private readonly _items: NodeList,
	) {
		this._collector = new ArticleItemCollector(articleId, title);
	}

	async parse(): Promise<ArticleItems<never>> {
		await this._parseItems(this._items);
		return this._collector.finish();
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
			this._collector.enterHeading(item.textContent.trim(), parseInt(tag[1], 10));
		}
		switch (tag) {
			case "p":
			case "strong":
				this._collector.addText(item.textContent.trim());
				break;
			case "li":
				this._collector.addText(item.textContent.trim());
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
		for (const row of table.childNodes ?? []) {
			for (const cell of row.childNodes ?? []) {
				if (cell.childNodes) await this._parseItems(cell.childNodes);
			}
		}
	}
}
