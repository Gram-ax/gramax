import ArticleProvider from "@ext/articleProvider/logic/ArticleProvider";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import FileProvider from "@core/FileProvider/model/FileProvider";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import FileStructure from "@core/FileStructue/FileStructure";
import Path from "@core/FileProvider/Path/Path";
import { SNIPPETS_DIRECTORY } from "@app/config/const";
import { JSONContent } from "@tiptap/core";
import MarkdownFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatter";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import Context from "@core/Context/Context";
import { ItemID } from "@ext/articleProvider/models/types";
import { Article, ArticleProps } from "@core/FileStructue/Article/Article";
import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";

declare module "@ext/articleProvider/logic/ArticleProvider" {
	export enum ArticleProviders {
		snippet = "snippet",
	}
}

export default class SnippetProvider extends ArticleProvider {
	constructor(fp: FileProvider, fs: FileStructure, catalog: Catalog) {
		super(fp, fs, catalog, new Path(SNIPPETS_DIRECTORY));

		fs.events.on("catalog-read", async () => {
			await this.readArticles(this._catalog.getRootCategoryDirectoryPath().join(new Path(".snippets")));
			await this.readArticles();
		});
	}

	public async getArticlesWithSnippet(snippetId: string) {
		const result = [];
		for (const item of this._catalog.getContentItems()) {
			await item.parsedContent.read((p) => {
				if (p?.snippets.has(snippetId)) result.push(item);
			});
		}

		return result;
	}

	public async getEditData(snippetId: string, parser: MarkdownParser) {
		const snippet = this.getArticle(snippetId);
		if (!snippet) return;
		if (await snippet.parsedContent.isNull())
			await snippet.parsedContent.write(() => parser.parse(snippet.content));

		return await snippet.parsedContent.read((p) => {
			return p.editTree;
		});
	}

	public async getRenderData(snippetId: string, context: ParserContext) {
		const snippet = this.getArticle(snippetId);
		if (!snippet) throw new Error("Snippet not found");
		if (await snippet.parsedContent.isNull()) {
			await snippet.parsedContent.write(() => context.parser.parse(snippet.content, context));
		}

		return await snippet.parsedContent.read((p) => {
			return { id: snippetId, title: snippet.getTitle(), content: (p.renderTree as Tag).children };
		});
	}

	override async remove(
		id: ItemID,
		parser: MarkdownParser,
		parserContextFactory: ParserContextFactory,
		ctx: Context,
	) {
		const article = this.getArticle(id);

		const articles = await this.getArticlesWithSnippet(id);
		for (const article of articles) {
			await article.parsedContent.write(() => null);
		}

		if (this._isOldSnippet(article.ref.path)) {
			await this._fp.delete(article.ref.path);
			await this.remove(id, parser, parserContextFactory, ctx);

			return;
		}

		await super.remove(id, parser, parserContextFactory, ctx);
	}

	public async clearArticlesContentWithSnippet(snippetId: string) {
		const articles = await this.getArticlesWithSnippet(snippetId);
		for (const article of articles) {
			await article.parsedContent.write(() => null);
		}
	}

	public async getSnippetsPaths() {
		const items = (await this.getItems(true)) as Article<ArticleProps>[];
		return items.map((a) => a.ref.path);
	}

	override async updateContent(
		id: ItemID,
		editTree: JSONContent,
		formatter: MarkdownFormatter,
		parserContextFactory: ParserContextFactory,
		parser: MarkdownParser,
		ctx: Context,
	) {
		const article = this.getArticle(id);
		if (!article) return;

		if (this._isOldSnippet(article.ref.path)) {
			await this.remove(id, parser, parserContextFactory, ctx);
			await this._fp.delete(article.ref.path);

			await this.create(
				article.ref.path.name,
				editTree,
				formatter,
				parserContextFactory,
				parser,
				ctx,
				article.props,
			);

			return;
		}

		await super.updateContent(id, editTree, formatter, parserContextFactory, parser, ctx);
	}

	private _isOldSnippet(path: Path) {
		return path.value.includes(".snippets");
	}
}
