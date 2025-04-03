import createUUID from "@ext/serach/utils/createUUID";
import { GramaxArticle } from "@ext/serach/vector/GramaxCatalog";
import { ArticleBlock, ArticleBlockId } from "@ics/gx-vector-search";
import { JSONContent } from "@tiptap/core";

abstract class GramaxBaseArticleBlock implements ArticleBlock {
	constructor(protected readonly article: GramaxArticle, protected readonly parent: ArticleBlock | null) {}

	getId(): ArticleBlockId {
		return createUUID(this.article.getId(), this.parent?.getId(), this.getPlainText());
	}

	getParent(): ArticleBlock | null {
		return this.parent;
	}

	abstract getPlainText(): string;

	abstract getModel(): JSONContent;
}

class GramaxArticleTopLevelBlock extends GramaxBaseArticleBlock implements ArticleBlock {
	constructor(private readonly model: JSONContent, article: GramaxArticle, parent: ArticleBlock | null) {
		super(article, parent);
	}

	getModel() {
		return this.model;
	}

	getPlainText(): string {
		return this.model.content?.map((content) => content.text).join("") ?? "";
	}
}

class GramaxNoteBlock extends GramaxBaseArticleBlock implements ArticleBlock {
	constructor(private readonly model: JSONContent, article: GramaxArticle, parent: ArticleBlock | null) {
		super(article, parent);
	}

	getModel() {
		return this.model;
	}

	getPlainText(): string {
		return this.model.attrs.title;
	}
}

class GramaxTableBlock extends GramaxBaseArticleBlock implements ArticleBlock {
	constructor(private readonly model: JSONContent, article: GramaxArticle, parent: ArticleBlock | null) {
		super(article, parent);
	}

	getModel() {
		return this.model;
	}

	getPlainText(): string {
		return this.model.content
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
}

export { GramaxArticleTopLevelBlock, GramaxBaseArticleBlock, GramaxNoteBlock, GramaxTableBlock };
