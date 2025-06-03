import { GRAMAX_DIRECTORY } from "@app/config/const";
import DateUtils from "@core-ui/utils/dateUtils";
import Context from "@core/Context/Context";
import FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import { Article, ArticleProps } from "@core/FileStructue/Article/Article";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import FileStructure from "@core/FileStructue/FileStructure";
import ResourceUpdaterFactory from "@core/Resource/ResourceUpdaterFactory";
import { ItemID } from "@ext/articleProvider/models/types";
import { convertContentToUiLanguage } from "@ext/localization/locale/translate";
import MarkdownFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatter";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import { JSONContent } from "@tiptap/core";
import assert from "assert";

export enum ArticleProviders {}
export type ArticleProviderType = keyof typeof ArticleProviders;

export default class ArticleProvider {
	private _articles = new Map<ItemID, Article<ArticleProps>>();
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
				return catalog.customProviders.snippetProvider;
			case "inbox":
				return catalog.customProviders.inboxProvider;
			case "template":
				return catalog.customProviders.templateProvider;
			case "prompt":
				return catalog.customProviders.promptProvider;
			default:
				throw new Error(`Unknown article provider type: ${type}`);
		}
	}

	public async create(
		id: ItemID,
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

	public getContent(id: ItemID) {
		const article = this.getArticle(id);
		assert(article, `Article with id ${id} not found in provider`);
		return article.content;
	}

	public async getEditTreeFromContent(
		id: ItemID,
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

	public getArticle(id: ItemID) {
		return this._articles.get(id);
	}

	public async remove(id: ItemID, parser: MarkdownParser, parserContextFactory: ParserContextFactory, ctx: Context) {
		const article = this.getArticle(id);
		assert(article, `Article with id ${id} not found in provider`);
		this._articles.delete(id);

		if (await article.parsedContent.isNull()) {
			const context = await parserContextFactory.fromArticle(
				article,
				this._catalog,
				convertContentToUiLanguage(ctx.contentLanguage || this._catalog.props.language),
				ctx.user.isLogged,
			);

			await article.parsedContent.write(() => parser.parse(article.content, context));
		}

		await article.parsedContent.write(async (p) => {
			await p.resourceManager.deleteAll();
			return p;
		});

		if (await this._fp.exists(this._formatPath(id))) await this._fp.delete(this._formatPath(id));
	}

	public async getEditTree(
		id: ItemID,
		parser: MarkdownParser,
		parserContextFactory: ParserContextFactory,
		ctx: Context,
	) {
		const article = this.getArticle(id);
		assert(article, `Template with id ${id} not found`);

		if (article.parsedContent.isNull) {
			const context = await parserContextFactory.fromArticle(
				article,
				this._catalog,
				convertContentToUiLanguage(ctx.contentLanguage || this._catalog.props.language),
				ctx.user.isLogged,
			);

			await article.parsedContent.write(() => parser.parse(article.content, context));
		}

		return article.parsedContent.read((p) => p.editTree);
	}

	public async updateProps(
		id: ItemID,
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

	public findItemByLogicPath(logicPath: string) {
		return Array.from(this._articles.values()).find((item) => item.logicPath === logicPath);
	}

	public async updateContent(
		id: ItemID,
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
		await article.parsedContent.write(() => parser.parse(content, context));
	}

	public async getItems<T = unknown>(simple?: boolean): Promise<T[]> {
		if (!this._articles.size) await this.readArticles();
		if (simple) return Array.from(this._articles.values()).map((item) => item as T);

		const notes: T[] = [];
		const values = Array.from(this._articles.values()).sort((a, b) =>
			DateUtils.sort(b.lastModified, a.lastModified),
		);

		for (const item of values) {
			notes.push(await this._createItem<T>(item));
		}

		return notes;
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
				if (!item.name.endsWith(".md")) continue;

				const { props, content } = this._fs.parseMarkdown(await this._fp.read(newPath));
				const lastModified = (await this._fp.getStat(newPath)).mtimeMs;
				const article = this._createArticle(newPath, props, lastModified, content);
				this._setArticle(article);
			}
		}
	}

	private _formatPath(id: ItemID) {
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

	protected _createItem<T = any>(item: Article<ArticleProps>): T | Promise<T> {
		return {
			id: item.ref.path.name,
			title: item.props.title ?? "",
		} as T;
	}
}
