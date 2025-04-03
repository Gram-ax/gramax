import ArticleProvider, { ArticleID } from "@core/FileStructue/Article/ArticleProvider";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import SitePresenter from "@core/SitePresenter/SitePresenter";
import SnippetEditorProps from "@ext/markdown/elements/snippet/edit/model/SnippetEditorProps.schema";
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
import { convertContentToUiLanguage } from "@ext/localization/locale/translate";

declare module "@core/FileStructue/Article/ArticleProvider" {
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

	public async getArticlesWithSnippet(snippetId: string, sp: SitePresenter) {
		await sp.parseAllItems(this._catalog);
		const result = [];
		for (const item of this._catalog.getContentItems()) {
			await item.parsedContent.read((p) => {
				if (p.snippets.has(snippetId)) result.push(item);
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
			return { id: snippetId, title: snippet.getTitle(), content: p.editTree };
		});
	}

	public async getRenderData(snippetId: string, parser: MarkdownParser) {
		const snippet = this.getArticle(snippetId);
		if (!snippet) throw new Error("Snippet not found");
		if (await snippet.parsedContent.isNull())
			await snippet.parsedContent.write(() => parser.parse(snippet.content));

		return await snippet.parsedContent.read((p) => {
			return { id: snippetId, title: snippet.getTitle(), content: (p.renderTree as Tag).children };
		});
	}

	public getListData() {
		const data: SnippetEditorProps[] = Array.from(this.articles.values()).map((a) => ({
			id: a.ref.path.name,
			title: a.getTitle(),
		}));

		return data;
	}

	override async updateContent(
		id: ArticleID,
		editTree: JSONContent,
		formatter: MarkdownFormatter,
		parserContextFactory: ParserContextFactory,
		parser: MarkdownParser,
		ctx: Context,
	) {
		const article = this.getArticle(id);
		if (!article) return;

		if (article.ref.path.value.includes(".snippets")) {
			await this.remove(id);
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

		const context = parserContextFactory.fromArticle(
			article,
			this._catalog,
			convertContentToUiLanguage(ctx.contentLanguage || this._catalog.props.language),
			ctx.user.isLogged,
		);

		const markdown = await formatter.render(editTree, context);
		await article.updateContent(markdown);
		await article.parsedContent.write(() => parser.parse(article.content, context));
	}
}
