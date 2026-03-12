import { SNIPPETS_DIRECTORY } from "@app/config/const";
import type Context from "@core/Context/Context";
import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type FileStructure from "@core/FileStructue/FileStructure";
import ArticleProvider from "@ext/articleProvider/logic/ArticleProvider";
import type { ItemID } from "@ext/articleProvider/models/types";
import type MarkdownFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatter";
import type MarkdownParser from "@ext/markdown/core/Parser/Parser";
import type ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import type ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import type { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import type { JSONContent } from "@tiptap/core";

declare module "@ext/articleProvider/logic/ArticleProvider" {
	export enum ArticleProviders {
		snippet = "snippet",
	}
}

export default class SnippetProvider extends ArticleProvider {
	private _parsing = new Map<string, Promise<void>>();

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
				if (p?.parsedContext.snippet.has(snippetId)) result.push(item);
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

		if (this._parsing.has(snippetId)) {
			await this._parsing.get(snippetId);
		} else if (await snippet.parsedContent.isNull()) {
			let resolve: () => void;
			const promise = new Promise<void>((res) => {
				resolve = res;
			});
			this._parsing.set(snippetId, promise);

			try {
				await snippet.parsedContent.write(() => context.parser.parse(snippet.content, context));
			} finally {
				this._parsing.delete(snippetId);
				resolve();
			}
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
