import { TEMPLATES_DIRECTORY } from "@app/config/const";
import FileProvider from "@core/FileProvider/model/FileProvider";
import { Article } from "@core/FileStructue/Article/Article";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import ArticleProvider from "@ext/articleProvider/logic/ArticleProvider";
import FileStructure from "@core/FileStructue/FileStructure";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import Context from "@core/Context/Context";
import { convertContentToUiLanguage } from "@ext/localization/locale/translate";
import Path from "@core/FileProvider/Path/Path";
import ResourceUpdaterFactory from "@core/Resource/ResourceUpdaterFactory";
import assert from "assert";
import MarkdownFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatter";
import { JSONContent } from "@tiptap/core";
import { ItemID } from "@ext/articleProvider/models/types";
import { Property } from "@ext/properties/models";

declare module "@ext/articleProvider/logic/ArticleProvider" {
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

	public async setArticleAsTemplate(
		articlePath: string,
		templateId: string,
		rc: ResourceUpdaterFactory,
		ctx: Context,
	) {
		const article = this._catalog.findItemByItemPath<Article>(new Path(articlePath));
		assert(article, `article ${articlePath} (templateId: ${templateId}) not found`);

		await article.updateProps({ template: templateId }, rc.withContext(ctx)(this._catalog), this._catalog);
		await article.updateContent("\n\n", true);
	}

	override async updateContent(
		id: ItemID,
		editTree: JSONContent,
		formatter: MarkdownFormatter,
		parserContextFactory: ParserContextFactory,
		parser: MarkdownParser,
		ctx: Context,
	) {
		const article = this._findTemplate(id);

		for (const item of this._catalog.getItems() as Article[]) {
			if (item.props.template === id) {
				await item.updateContent("");
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

	public getProperties(id: ItemID): Property[] {
		const article = this._findTemplate(id);
		return article.props.customProperties || [];
	}

	public async saveCustomProperty(id: ItemID, property: Property) {
		const article = this._findTemplate(id);
		const customProperties = article.props?.customProperties || [];
		const index = customProperties.findIndex((p) => p.name === property.name);

		index === -1 ? customProperties.push(property) : (customProperties[index] = property);
		article.props.customProperties = customProperties;

		await article.save();
	}

	public async deleteCustomProperty(id: ItemID, propertyName: string) {
		const article = this._findTemplate(id);
		const customProperties = article.props?.customProperties || [];
		const index = customProperties.findIndex((p) => p.name === propertyName);
		assert(index !== -1, `Property ${propertyName} not found`);

		customProperties.splice(index, 1);
		article.props.customProperties = customProperties;

		await article.save();
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

	private _findTemplate(id: ItemID) {
		const article = this.getArticle(id);
		assert(article, `Template with id ${id} not found`);
		return article;
	}
}
