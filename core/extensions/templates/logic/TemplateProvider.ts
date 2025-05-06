import { TEMPLATES_DIRECTORY } from "@app/config/const";
import FileProvider from "@core/FileProvider/model/FileProvider";
import { ArticleProps } from "@core/FileStructue/Article/Article";
import { Article } from "@core/FileStructue/Article/Article";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import ArticleProvider, { ArticleID } from "@core/FileStructue/Article/ArticleProvider";
import FileStructure from "@core/FileStructue/FileStructure";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import Context from "@core/Context/Context";
import { convertContentToUiLanguage } from "@ext/localization/locale/translate";
import Path from "@core/FileProvider/Path/Path";
import { TemplateItemProps, TemplateProps } from "@ext/templates/models/types";
import DateUtils from "@core-ui/utils/dateUtils";
import ResourceUpdaterFactory from "@core/Resource/ResourceUpdaterFactory";
import assert from "assert";
import MarkdownFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatter";
import { JSONContent } from "@tiptap/core";

declare module "@core/FileStructue/Article/ArticleProvider" {
	export enum ArticleProviders {
		template = "template",
	}
}

export default class TemplateProvider extends ArticleProvider {
	constructor(fp: FileProvider, fs: FileStructure, catalog: Catalog) {
		super(fp, fs, catalog, new Path(TEMPLATES_DIRECTORY));

		fs.events.on("catalog-read", async () => {
			await this.readArticles();
		});
	}

	public async getTemplates(
		parser: MarkdownParser,
		parserContextFactory: ParserContextFactory,
		ctx: Context,
	): Promise<TemplateProps[]> {
		if (!this.articles.size) await this.readArticles();

		const notes: TemplateProps[] = [];
		const values = Array.from(this.articles.values()).sort((a, b) =>
			DateUtils.sort(b.lastModified, a.lastModified),
		);

		for (const item of values) {
			const context = await parserContextFactory.fromArticle(
				item,
				this._catalog,
				convertContentToUiLanguage(ctx.contentLanguage || this._catalog.props.language),
				ctx.user.isLogged,
			);

			await item.parsedContent.write(() => parser.parse(item.content, context));
			notes.push(this._createTemplate(item));
		}

		return notes;
	}

	public async getTemplatesList(): Promise<TemplateItemProps[]> {
		if (!this.articles.size) await this.readArticles();

		return Array.from(this.articles.values()).map((item) => ({
			id: item.ref.path.name,
			title: item.props.title ?? "",
		}));
	}

	public async getEditTree(
		id: ArticleID,
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

	public async setArticleAsTemplate(
		articlePath: string,
		templateId: string,
		rc: ResourceUpdaterFactory,
		ctx: Context,
	) {
		const article = this._catalog.findItemByItemPath<Article>(new Path(articlePath));
		assert(article, `article ${articlePath} (templateId: ${templateId}) not found`);

		const parentRef = article.parent.ref;
		await this._catalog.createTemplateArticle(article.ref, templateId, rc.withContext(ctx), parentRef);
	}

	private _createTemplate(item: Article<ArticleProps>): TemplateProps {
		const itemRef = this._fp.getItemRef(item.ref.path);
		return {
			id: item.ref.path.name,
			title: item.props.title ?? "",
			logicPath: item.logicPath,
			ref: {
				path: itemRef.path.value,
				storageId: itemRef.storageId,
			},
		};
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
		assert(article, `Template with id ${id} not found`);

		for (const item of this._catalog.getItems() as Article[]) {
			if (item.props.template === id) {
				await item.updateContent("", true);
			}
		}

		const context = await parserContextFactory.fromArticle(
			article,
			this._catalog,
			convertContentToUiLanguage(ctx.contentLanguage || this._catalog.props.language),
			ctx.user.isLogged,
		);

		const markdown = await formatter.render(editTree, context);
		await article.updateContent(markdown);
		await article.parsedContent.write(() => parser.parse(article.content, context));
	}

	public async updateTemplateArticleField(
		articlePath: string,
		field: string,
		content: JSONContent[],
		formatter: MarkdownFormatter,
		resourceUpdaterFactory: ResourceUpdaterFactory,
		parser: MarkdownParser,
		parserContextFactory: ParserContextFactory,
		ctx: Context,
	) {
		const article = this._catalog.findItemByItemPath<Article>(new Path(articlePath));
		assert(article, `article ${articlePath} (field: ${field}) not found`);

		const context = await parserContextFactory.fromArticle(
			article,
			this._catalog,
			convertContentToUiLanguage(ctx.contentLanguage || this._catalog.props.language),
			ctx.user.isLogged,
		);

		const markdown = await formatter.render({ type: "doc", content }, context);

		const props = { ...article.props, logicPath: article.logicPath };

		const fields = props.fields || [];
		const existField = fields.findIndex((f) => f.name === field);
		if (existField === -1) {
			fields.push({ name: field, value: markdown });
		} else {
			fields[existField].value = markdown;
		}

		props.fields = fields;

		await this._catalog.updateItemProps(props, resourceUpdaterFactory.withContext(ctx));
		await article.parsedContent.write(() => parser.parse(markdown, context));
	}

	public async removeTemplateArticleField(
		articlePath: string,
		field: string,
		resourceUpdaterFactory: ResourceUpdaterFactory,
		ctx: Context,
	) {
		const article = this._catalog.findItemByItemPath<Article>(new Path(articlePath));
		assert(article, `article ${articlePath} (field: ${field}) not found`);

		const props = { ...article.props, logicPath: article.logicPath };
		if (!props.fields) return;

		const existField = props.fields.findIndex((f) => f.name === field);

		if (existField === -1) return;

		props.fields.splice(existField, 1);
		await this._catalog.updateItemProps(props, resourceUpdaterFactory.withContext(ctx));
	}
}
