import { GRAMAX_DIRECTORY } from "@app/config/const";
import Context from "@core/Context/Context";
import FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import { Article, ArticleProps } from "@core/FileStructue/Article/Article";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import FileStructure from "@core/FileStructue/FileStructure";
import ResourceUpdaterFactory from "@core/Resource/ResourceUpdaterFactory";
import { convertContentToUiLanguage } from "@ext/localization/locale/translate";
import MarkdownFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatter";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import { JSONContent } from "@tiptap/core";
import assert from "assert";

export type ArticleID = string;
export enum ArticleProviders {}
export type ArticleProviderType = keyof typeof ArticleProviders;

export default class ArticleProvider {
	private _articles = new Map<ArticleID, Article<ArticleProps>>();
	private _rootPath: Path;

	constructor(
		protected _fp: FileProvider,
		protected _fs: FileStructure,
		protected _catalog: Catalog,
		directory: Path,
	) {
		this._rootPath = new Path([this._catalog.basePath.value, GRAMAX_DIRECTORY, directory.value]);
	}

	public static getProvider(catalog: ContextualCatalog, type: ArticleProviderType) {
		switch (type) {
			case "snippet":
				return catalog.snippetProvider;
			case "inbox":
				return catalog.inboxProvider;
			case "template":
				return catalog.templateProvider;
			default:
				throw new Error(`Unknown article provider type: ${type}`);
		}
	}

	get articles() {
		return this._articles;
	}

	get rootPath() {
		return this._rootPath;
	}

	public async create(
		id: ArticleID,
		editTree: JSONContent,
		formatter: MarkdownFormatter,
		parserContextFactory: ParserContextFactory,
		parser: MarkdownParser,
		ctx: Context,
		props: ArticleProps,
	): Promise<Article<ArticleProps>> {
		const article = this._createArticle(this._formatPath(id), props, new Date().getTime(), "\n\n");
		this._setArticle(article);

		await this.updateContent(id, editTree, formatter, parserContextFactory, parser, ctx);
		return article;
	}

	public getContent(id: ArticleID) {
		const article = this.getArticle(id);
		assert(article, `Article with id ${id} not found in provider`);
		return article.content;
	}

	public async getEditTreeFromContent(
		id: ArticleID,
		content: string,
		parser: MarkdownParser,
		parserContextFactory: ParserContextFactory,
		ctx: Context,
	): Promise<JSONContent> {
		const article = this.getArticle(id);
		assert(article, `Article with id ${id} not found in provider`);

		const context = await parserContextFactory.fromArticle(
			article,
			this._catalog,
			convertContentToUiLanguage(ctx.contentLanguage || this._catalog.props.language),
			ctx.user.isLogged,
		);

		return (await parser.parse(content, context))?.editTree;
	}

	public getArticle(id: ArticleID) {
		return this._articles.get(id);
	}

	public async remove(id: ArticleID) {
		this._articles.delete(id);
		if (await this._fp.exists(this._formatPath(id))) await this._fp.delete(this._formatPath(id));
	}

	public async existsFolder(id: ArticleID) {
		return await this._fp.exists(this._formatPath(id));
	}

	public async updateProps(
		id: ArticleID,
		resourceUpdaterFactory: ResourceUpdaterFactory,
		props?: ArticleProps,
		ctx?: Context,
	) {
		const article = this.getArticle(id);
		if (!article) return;

		await article.updateProps(
			{ ...props, logicPath: article.logicPath },
			resourceUpdaterFactory.withContext(ctx)(this._catalog),
			this._catalog,
		);
	}

	public async updateContent(
		id: ArticleID,
		editTree: JSONContent,
		formatter: MarkdownFormatter,
		parserContextFactory: ParserContextFactory,
		parser: MarkdownParser,
		ctx: Context,
	) {
		const article = this.getArticle(id);
		if (!article) return;

		const context = await parserContextFactory.fromArticle(
			article,
			this._catalog,
			convertContentToUiLanguage(ctx.contentLanguage || this._catalog.props.language),
			ctx.user.isLogged,
		);

		const content = await formatter.render(editTree, context);
		await article.updateContent(content);
	}

	public async readArticles(path?: Path) {
		const rootPath: Path = path ?? this._rootPath;
		if (!(await this._fp.exists(rootPath))) return;
		const items = await this._fp.getItems(rootPath);

		for (const item of items) {
			const newPath = rootPath.join(new Path(item.name));

			if (item.isDirectory()) {
				await this.readArticles(newPath);
			} else {
				const { props, content } = this._fs.parseMarkdown(await this._fp.read(newPath));
				const lastModified = (await this._fp.getStat(newPath)).mtimeMs;
				const article = this._createArticle(newPath, props, lastModified, content);
				this._setArticle(article);
			}
		}
	}

	private _formatPath(id: ArticleID) {
		return this._rootPath.join(new Path(id + ".md"));
	}

	private _setArticle(article: Article<ArticleProps>) {
		this._articles.set(article.ref.path.name, article);
	}

	private _createArticle(
		path: Path,
		props: ArticleProps,
		lastModified: number = new Date().getTime(),
		content?: string,
	) {
		return new Article({
			ref: this._fs.fp.getItemRef(path),
			parent: null,
			props,
			content: content ?? "",
			logicPath: path.stripExtension,
			fs: this._fs,
			lastModified,
		});
	}
}
