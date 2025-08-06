import { Article } from "@core/FileStructue/Article/Article";
import { ItemFilter } from "@core/FileStructue/Catalog/Catalog";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import { Category } from "@core/FileStructue/Category/Category";
import { Item } from "@core/FileStructue/Item/Item";
import sortMapByName from "@ext/markdown/elements/view/render/logic/sortMap";
import getAllCatalogProperties from "@ext/properties/logic/getAllCatalogProps";
import getDisplayValue from "@ext/properties/logic/getDisplayValue";
import { Property, PropertyTypes, PropertyValue, SystemProperties, ViewRenderGroup } from "@ext/properties/models";
import { Display } from "../models/display";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import Context from "@core/Context/Context";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import { convertContentToUiLanguage } from "@ext/localization/locale/translate";
import ViewSorter from "@ext/properties/logic/ViewSorter";

export interface ProcessedArticle {
	title: string;
	resourcePath: string;
	linkPath: string;
	itemPath: string;
	otherProps: Property[];
	groupValues: (string | string[])[];
}

export type OrderValue = { name: string; value: string[] };
type ArticleFilterOptions = {
	ignoreProps?: string[];
};

class ViewFilter extends ViewSorter {
	private _catalogPropMap: Map<string, Property>;

	constructor(
		private _defs: PropertyValue[],
		private _orderby: OrderValue[],
		private _groupby: string[],
		private _select: string[],
		private _articles: Article[],
		private _curArticle: Article,
		private _catalog: ReadonlyCatalog,
		private _display: Display = Display.List,
		private _itemFilters: ItemFilter[] = [],
		private _parserContextFactory: ParserContextFactory,
		private _parser: MarkdownParser,
		private _ctx: Context,
	) {
		super();
	}

	public async getFilteredArticles(): Promise<ViewRenderGroup[]> {
		const groups = this._group(await this._filter());
		return this._flattenGroups(groups);
	}

	private async _filter(): Promise<ProcessedArticle[]> {
		this._catalogPropMap = new Map(getAllCatalogProperties(this._catalog).map((prop) => [prop.name, prop]));

		const processedArticles = [];
		const uniqueArticles = new Set<string>();
		const systemProperties = (await this._handleSystemProperty(uniqueArticles)) || [];
		processedArticles.push(...systemProperties);
		processedArticles.push(
			...(await Promise.all(
				this._articles
					.filter((article) => this._filterArticle(uniqueArticles, article))
					.map(async (article) => {
						return await this._proccessArticle(article, (refPath) => uniqueArticles.add(refPath));
					}),
			)),
		);

		return processedArticles;
	}

	private _filterArticle(uniqueArticles: Set<string>, article: Item, options?: ArticleFilterOptions) {
		return this._defs.every((defProp) => {
			const articleProp = article.props?.properties?.find((p) => p.name === defProp.name);
			if (articleProp && defProp?.value?.some((val) => articleProp.value?.includes(val))) return false;

			const ignoreProps = options?.ignoreProps || [];
			const isIgnoreProp = ignoreProps.includes(defProp.name);

			if (defProp?.value?.includes("yes") && !isIgnoreProp) return !articleProp;
			if (defProp?.value?.includes("none") && !isIgnoreProp) return !!articleProp;
			if (uniqueArticles.has(article?.ref?.path?.value)) return false;

			return true;
		});
	}

	private _filterProps(props: Property[]): Property[] {
		return props
			.filter((prop) => this._catalogPropMap.has(prop.name) && this._select.includes(prop.name))
			.map((prop) => {
				if (!prop.value) return prop;
				return { ...prop, value: Array.isArray(prop.value) ? [...prop.value] : prop.value };
			});
	}

	private async _proccessArticle(article: Article, callback: (refPath: string) => void): Promise<ProcessedArticle> {
		const resourcePath = this._curArticle.ref.path.getRelativePath(article.ref.path).value;
		const extendedProperties =
			(article.props?.properties?.map((prop) => {
				const catalogProp = this._catalogPropMap.get(prop.name);
				return catalogProp ? { ...catalogProp, ...prop } : prop;
			}) as Property[]) ?? [];

		callback(article.ref.path.value);

		return {
			title: article.props.title,
			resourcePath,
			itemPath: article.ref.path.value,
			linkPath: await this._catalog.getPathname(article),
			groupValues: this._groupby.map((groupProp) => {
				const prop = extendedProperties.find((p) => p.name === groupProp);
				return prop?.value ?? prop?.name ?? null;
			}),
			otherProps: sortMapByName(
				Array.from(this._catalogPropMap.keys()),
				await this._processProps(article, this._filterProps(extendedProperties)),
			),
		};
	}

	private async _processProps(article: Article, props: Property[]): Promise<Property[]> {
		const newProps = [];

		for (const prop of props) {
			if (prop.type === PropertyTypes.blockMd) {
				const context = await this._parserContextFactory.fromArticle(
					article,
					this._catalog,
					convertContentToUiLanguage(this._ctx.contentLanguage || this._catalog.props.language),
					this._ctx.user.isLogged,
				);

				const content = await this._parser.parse(prop.value?.[0], context);
				console.log(content.renderTree);
				newProps.push({ ...prop, value: [content.renderTree] });
			}

			newProps.push(prop);
		}

		return newProps;
	}

	private _group(articles: ProcessedArticle[], groupIndex: number = 0): ViewRenderGroup[] {
		if (groupIndex >= this._groupby.length) {
			return [
				{
					group: null,
					articles: this._sortArticle(articles, this._orderby).map(
						({ title, resourcePath, linkPath, itemPath, otherProps }) => ({
							title,
							resourcePath,
							itemPath,
							linkPath,
							otherProps,
						}),
					),
				},
			];
		}

		let groupedArticles = articles.reduce((acc, article) => {
			const groupValue = article.groupValues[groupIndex];
			const groupValueType = this._catalogPropMap.get(this._groupby[groupIndex])?.type;
			const key = this._createKey(groupValue, groupValueType);
			(acc[key] ??= []).push(article);
			return acc;
		}, {} as Record<string, ProcessedArticle[]>);

		if (this._display === Display.Kanban) {
			const groupProp = this._groupby?.[0];
			const values = this._catalogPropMap.get(groupProp)?.values || [];
			const filterProp = this._defs.find((prop) => prop.name === groupProp);

			values
				.filter((value) => !filterProp?.value?.includes(value))
				.forEach((value) => {
					if (!groupedArticles[value]) groupedArticles[value] = [];
				});

			const sortedKeys = values.filter((value) => Object.prototype.hasOwnProperty.call(groupedArticles, value));

			const sortedGroupedArticles = {};
			sortedKeys.forEach((key) => {
				sortedGroupedArticles[key] = groupedArticles[key];
			});

			groupedArticles = sortedGroupedArticles;
		}

		const groups = Object.entries(groupedArticles).map(([groupKey, groupArticles]) => ({
			group: groupKey === "ungrouped" ? [null] : [groupKey],
			articles: [],
			subgroups: this._group(this._sortArticle(groupArticles, this._orderby), groupIndex + 1),
		}));

		return this._sortGroup(groups, this._orderby, this._groupby[groupIndex]);
	}

	private _createKey(groupValue: string | string[], groupValueType: PropertyTypes): string {
		if (groupValueType === PropertyTypes.blockMd) return "ungrouped";

		const key =
			groupValue !== null && groupValue !== undefined ? getDisplayValue(groupValueType, groupValue) : "ungrouped";
		return String(key);
	}

	private _flattenGroups(groups: ViewRenderGroup[]): ViewRenderGroup[] {
		return groups?.map((group) => {
			if (group?.subgroups?.length === 0) {
				return {
					...group,
					articles: this._sortArticle(group.articles as ProcessedArticle[], this._orderby),
				};
			}

			const flattenedSubgroups = this._flattenGroups(group.subgroups);

			return {
				...group,
				subgroups: flattenedSubgroups,
			};
		});
	}

	private async _handleSystemProperty(uniqueArticles: Set<string>): Promise<ProcessedArticle[]> {
		const defs = this._defs || [];
		const hierarchyDef = defs.find((property) => SystemProperties[property.name]);
		if (!hierarchyDef) return [];

		if (!hierarchyDef.value.includes("child-to-current"))
			return await Promise.all(
				((this._curArticle as Category)?.getFilteredItems?.(this._itemFilters, this._catalog) || [])
					?.filter((article) =>
						this._filterArticle(uniqueArticles, article, { ignoreProps: [SystemProperties.hierarchy] }),
					)
					?.map(async (article) => {
						return await this._proccessArticle(article as Article, (refPath) =>
							uniqueArticles.add(refPath),
						);
					}),
			);
		else {
			(this._curArticle as Category)?.items?.map((article) => {
				uniqueArticles.add(article.ref.path.value);
			});
		}

		return [];
	}
}

export default ViewFilter;
