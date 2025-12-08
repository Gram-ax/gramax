import HeaderArticleBlock from "./HeaderArticleBlock";
import { ArticleItem, ArticleBlock } from "@ics/gx-vector-search";

export default abstract class SearchArticleContentParserBase {
	protected _children: ArticleItem[] = [];
	protected _blocksStack: ArticleBlock[] = [];
	protected _curBlock: ArticleBlock | undefined;

	protected _addHeader(level: number, title: string): void {
		while (this._curBlock instanceof HeaderArticleBlock && this._curBlock.level >= level) {
			this._exitBlock();
		}

		this._enterBlock(new HeaderArticleBlock(level, title));
	}

	protected _addText(text: string) {
		this._addItem({
			type: "text",
			text,
		});
	}

	protected _addItem(item: ArticleItem) {
		if (!this._curBlock) {
			this._children.push(item);
		} else {
			this._curBlock.items.push(item);
		}
	}

	protected _enterBlock(block: ArticleBlock): void {
		if (this._curBlock) {
			this._blocksStack.push(this._curBlock);
			this._curBlock.items.push(block);
		} else {
			this._children.push(block);
		}

		this._curBlock = block;
	}

	protected _exitBlock(): void {
		this._curBlock = this._blocksStack.pop();
	}
}
