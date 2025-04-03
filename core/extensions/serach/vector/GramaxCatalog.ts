import createUUID from "@ext/serach/utils/createUUID";
import getParseContentItem, { ParseContext } from "@ext/serach/vector/getParseContentItem";
import { GramaxBaseArticleBlock } from "@ext/serach/vector/GramaxArticle";
import { Article, ArticleId, Catalog, CatalogId } from "@ics/gx-vector-search";
import { JSONContent } from "@tiptap/core";

export interface GramaxCatalogItem {
	parent?: GramaxCatalogItem;
	parsedContent?: { editTree: JSONContent };
	path: string;
	title: string;
	content: string;
}

export class GramaxCatalog implements Catalog {
	constructor(private readonly items: GramaxCatalogItem[], private readonly catalogName: string) {}

	getAllArticles(): GramaxArticle[] {
		const map: Map<GramaxCatalogItem, GramaxArticle> = new Map();
		return this.items.map((model) => {
			const article = new GramaxArticle(this, model, map.get(model.parent)! ?? null);
			map.set(model, article);
			return article;
		});
	}

	getId(): CatalogId {
		return this.catalogName;
	}
}

export class GramaxArticle implements Article {
	constructor(private readonly catalog: GramaxCatalog, private readonly model: GramaxCatalogItem, private readonly parent: GramaxArticle) {}

	getModel() {
		return this.model;
	}

	getParent(): Article {
		return this.parent;
	}

	getId(): ArticleId {
		return createUUID(this.catalog.getId(), this.parent?.getId(), this.model.content);
	}

	getBlocks(): GramaxBaseArticleBlock[] {
		if (!this.model.parsedContent) return [];

		const parseContext: ParseContext = {
			article: this,
			headings: new Map(),
			blocks: [],
			lastTopLevelBlock: { value: null },
			useDefault: true,
		};
		this.model.parsedContent.editTree.content.forEach(getParseContentItem(parseContext));
		return parseContext.blocks;
	}

	getTitle(): string {
		return this.model.title;
	}
}
