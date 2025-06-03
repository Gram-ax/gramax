import { ArticleBlock, ArticleItem, ArticleText } from "@ics/gx-vector-search";
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

	constructor(private readonly _items: JSONContent[]) {}

	parse(): ArticleItem[] {
		for (const contentItem of this._items) {
			this._parseItem(contentItem);
		}

		return this._children;
	}

	private _parseItem(item: JSONContent): void {
		switch (item.type) {
			case "paragraph":
				this._addParagraph(item);
				break;
			case "heading":
				this._addHeader(item);
				break;
			case "code_block":
				this._addCodeBlock(item);
				break;
			case "table":
				this._addTable(item);
				break;
			case "note":
				this._addNote(item);
				break;
			case "bulletList":
			case "orderedList":
				this._addList(item);
				break;
		}
	}

	private _addParagraph(paragraph: JSONContent): void {
		this._addText({
			type: "text",
			text: this._jsonToString(paragraph),
		});
	}

	private _addHeader(header: JSONContent): void {
		while (this._curBlock instanceof HeaderArticleBlock && this._curBlock.level >= header.attrs.level) {
			this._exitBlock();
		}

		this._enterBlock(new HeaderArticleBlock(header.attrs.level, this._jsonToString(header)));
	}

	private _addTable(table: JSONContent): void {
		this._addText({
			type: "text",
			text: this._tableToString(table),
		});
	}

	private _addCodeBlock(codeBlock: JSONContent): void {
		this._addText({
			type: "text",
			text: this._jsonToString(codeBlock),
		});
	}

	private _addList(list: JSONContent): void {
		list.content.forEach((listItem) => listItem.content.forEach((x) => this._parseItem(x)));
	}

	private _addNote(note: JSONContent): void {
		this._enterBlock({
			type: "block",
			items: [],
			title: note.attrs.title,
		});
		note.content.forEach((x) => this._parseItem(x));
		this._exitBlock();
	}

	private _addText(child: ArticleText) {
		if (!this._curBlock) {
			this._children.push(child);
		} else {
			this._curBlock.items.push(child);
		}
	}

	private _enterBlock(block: ArticleBlock) {
		if (this._curBlock) {
			this._blocksStack.push(this._curBlock);
			this._curBlock.items.push(block);
		} else {
			this._children.push(block);
		}

		this._curBlock = block;
	}

	private _exitBlock() {
		this._curBlock = this._blocksStack.pop();
	}

	private _tableToString(table: JSONContent): string {
		return table.content
			.map((row) => {
				const rowContent = row.content.map((cell) => {
					const cells = cell.content.map((contentItem) => {
						const cellTextContent = contentItem.content?.map((c) => c.text)?.join("");
						return cellTextContent;
					});
					return cells.join(" ");
				});
				return rowContent.join(" ");
			})
			.join("\n");
	}

	private _jsonToString(json: JSONContent): string {
		return json.content?.map((content) => content.text).join("") ?? "";
	}
}
