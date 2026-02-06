import { TEMPLATES_DIRECTORY } from "@app/config/const";
import Context from "@core/Context/Context";
import FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import { Article, ArticleProps } from "@core/FileStructue/Article/Article";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import FileStructure from "@core/FileStructue/FileStructure";
import ResourceUpdaterFactory from "@core/Resource/ResourceUpdaterFactory";
import ArticleProvider from "@ext/articleProvider/logic/ArticleProvider";
import { ItemID } from "@ext/articleProvider/models/types";
import { convertContentToUiLanguage } from "@ext/localization/locale/translate";
import MarkdownFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatter";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import { Property } from "@ext/properties/models";
import { JSONContent } from "@tiptap/core";
import assert from "assert";

declare module "@ext/articleProvider/logic/ArticleProvider" {
	export enum ArticleProviders {
		template = "template",
	}
}

type TransformedNames = Map<string, string>;

type TransformedProperties = {
	new: Property[];
	names: TransformedNames;
};

export default class TemplateProvider extends ArticleProvider {
	private _transferedLegacyProperties: boolean = false;

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

	public isTransferedLegacyProperties(): boolean {
		return this._transferedLegacyProperties;
	}

	public async transferLegacyProperties(
		resourceUpdaterFactory: ResourceUpdaterFactory,
		parserContextFactory: ParserContextFactory,
		parser: MarkdownParser,
		formatter: MarkdownFormatter,
		ctx: Context,
	): Promise<void> {
		if (this._transferedLegacyProperties) return;
		const templates = await this.getItems<Article<ArticleProps>>(true);

		const transfer = async (id: ItemID) => {
			const template = this._findTemplate(id);
			if (!template.props.customProperties || !template.props.customProperties.length) return;

			const { names } = await this._generateAndUpdateCatalogProps(template, resourceUpdaterFactory, ctx);

			await this._renamePropsInJSONContent(template, names, parser, formatter, parserContextFactory, ctx);

			for (const item of this._catalog.getContentItems()) {
				if (!item.props.template || item.props.template !== id) continue;
				const newProperties = item.props?.properties?.map((prop) => {
					if (!names.has(prop.name)) return prop;

					return { ...prop, name: names.get(prop.name) };
				});

				const newProps = { ...item.props, properties: newProperties || [], logicPath: item.logicPath };
				await this._catalog.updateItemProps(newProps, resourceUpdaterFactory.withContext(ctx));
			}
		};

		for (const template of templates) {
			if (template.props.customProperties?.length) await transfer(template.ref.path.name);
		}

		this._transferedLegacyProperties = true;
	}

	public getProperties(id: ItemID): Property[] {
		const article = this._findTemplate(id);
		return article.props.customProperties || [];
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

	private async _generateAndUpdateCatalogProps(
		template: Article<ArticleProps>,
		rc: ResourceUpdaterFactory,
		ctx: Context,
	): Promise<TransformedProperties> {
		const catalogPropNames = this._catalog.props.properties?.map((prop) => prop.name) || [];
		const names = new Set<string>(catalogPropNames);
		const newAndOldNames = new Map<string, string>();

		const generateNewName = (names: Set<string>, name: string): string => {
			let i = 1;

			while (names.has(name)) {
				name = `${name}-${i++}`;
			}

			return name;
		};

		const templateProperties = [...(template.props.customProperties || [])];
		const transformedOldProps = templateProperties.map((prop) => {
			if (!names.has(prop.name)) return prop;

			const oldName = prop.name;
			prop.name = generateNewName(names, oldName);
			names.add(prop.name);
			newAndOldNames.set(oldName, prop.name);

			return prop;
		});

		const updatedProps = { ...template.props, customProperties: [] };
		delete updatedProps.customProperties;
		await template.updateProps(updatedProps, rc.withContext(ctx)(this._catalog), this._catalog);

		const newCatalogProperties = [...(this._catalog.props.properties || [])];
		newCatalogProperties.push(...transformedOldProps);

		await this._catalog.updateProps(
			{ ...this._catalog.props, properties: newCatalogProperties },
			rc.withContext(ctx),
		);

		if (!this._catalog) return;
		return { new: this._catalog.props.properties, names: newAndOldNames };
	}

	private async _renamePropsInJSONContent(
		template: Article<ArticleProps>,
		names: TransformedNames,
		parser: MarkdownParser,
		formatter: MarkdownFormatter,
		parserContextFactory: ParserContextFactory,
		ctx: Context,
	) {
		const parserContext = await parserContextFactory.fromArticle(
			template,
			this._catalog,
			convertContentToUiLanguage(ctx.contentLanguage || this._catalog.props.language),
			ctx.user.isLogged,
		);

		const parsedContent = await parser.parse(template.content, parserContext);

		const recursiveRenameProps = (node: JSONContent): JSONContent => {
			const newNode = { ...node };

			if (node.attrs?.bind) {
				const oldName = node.attrs.bind;
				const newName = names.get(oldName);
				newNode.attrs = { ...node.attrs, bind: newName || oldName };
			}

			if (!node.content?.length) return newNode;
			if (node.content) newNode.content = node.content.map((child) => recursiveRenameProps(child));

			return newNode;
		};

		const updatedEditTree = recursiveRenameProps(parsedContent.editTree);
		await this.updateContent(template.ref.path.name, updatedEditTree, formatter, parserContextFactory, parser, ctx);
	}
}
