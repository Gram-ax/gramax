import { Article } from "@core/FileStructue/Article/Article";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import { Category } from "@core/FileStructue/Category/Category";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import sortMapByName from "@ext/markdown/elements/view/render/logic/sortMap";
import getAllCatalogProperties from "@ext/properties/logic/getAllCatalogProps";
import { Property, PropertyValue, SystemProperties, ViewRenderGroup } from "@ext/properties/models";
import { Display } from "@ext/properties/models/displays";
import astToParagraphs from "@ext/StyleGuide/logic/astToParagraphs";

interface ProcessedArticle {
	title: string;
	resourcePath: string;
	linkPath: string;
	itemPath: string;
	otherProps: Property[];
	groupValues: (string | string[])[];
}

interface PreProcessedArticle extends ProcessedArticle {
	extendedProperties: Property[];
}

class ViewFilter {
	private _defs: PropertyValue[];
	private _orderby: string[];
	private _groupby: string[];
	private _select: string[];
	private _articles: Article[];
	private _catalog: Catalog;
	private _curArticle: Article;
	private _display: Display = Display.List;
	private _catalogPropMap: Map<string, Property>;
	private _catalogPropMapKeys: string[];
	constructor(
		defs: PropertyValue[],
		orderby: string[],
		groupby: string[],
		select: string[],
		articles: Article[],
		curArticle: Article,
		catalog: Catalog,
		display?: Display,
	) {
		this._defs = defs;
		this._orderby = orderby;
		this._groupby = groupby;
		this._select = select;
		this._articles = articles;
		this._curArticle = curArticle;
		this._catalog = catalog;
		this._display = display;
	}

	public async getFilteredArticles(): Promise<ViewRenderGroup[]> {
		const groups = this._group(await this._filter());
		return this._flattenGroups(groups);
	}

	private async _filter(): Promise<ProcessedArticle[]> {
		this._catalogPropMap = new Map(getAllCatalogProperties(this._catalog).map((prop) => [prop.name, prop]));
		this._catalogPropMapKeys = Array.from(this._catalogPropMap.keys());

		const processedArticles = [];

		if (!this._defs.find((prop) => prop.name === (SystemProperties.hierarchy as string)))
			processedArticles.push(
				...(await this._handleDynamicProperty(
					this._curArticle,
					this._catalogPropMap.get(SystemProperties.hierarchy),
				)),
			);

		this._defs = this._defs.filter((val) => !SystemProperties[val.name.toLowerCase()]);
		processedArticles.push(
			...(await Promise.all(
				this._articles
					.filter((article) =>
						this._defs.every((defProp) => {
							const articleProp = article.props?.properties?.find((p) => p.name === defProp.name);
							if (articleProp && defProp?.value?.some((val) => articleProp.value?.includes(val)))
								return false;

							if (defProp.value.includes("yes")) return !articleProp;
							if (defProp.value.includes("none")) return !!articleProp;

							return true;
						}),
					)

					.map(async (article) => {
						const resourcePath = this._curArticle.ref.path.getRelativePath(article.ref.path).value;
						const extendedProperties =
							(article.props?.properties?.map((prop) => {
								const catalogProp = this._catalogPropMap.get(prop.name);
								return catalogProp ? { ...catalogProp, ...prop } : prop;
							}) as Property[]) ?? [];

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
								this._filterProps(extendedProperties),
							),

							extendedProperties,
						};
					}),
			)),
		);

		return processedArticles;
	}

	private _filterProps(props: Property[]): Property[] {
		return props.filter((prop) => this._catalogPropMap.has(prop.name) && this._select.includes(prop.name));
	}

	private _order(articles: ProcessedArticle[]): ProcessedArticle[] {
		const orderPropMap = new Map(this._orderby.map((prop) => [prop, true]));

		return articles.sort((a, b) => {
			const aHasOrderProps = a.otherProps.some((p) => orderPropMap.has(p.name));
			const bHasOrderProps = b.otherProps.some((p) => orderPropMap.has(p.name));

			if (aHasOrderProps !== bHasOrderProps) return aHasOrderProps ? -1 : 1;

			return 0;
		});
	}

	private _group(articles: ProcessedArticle[], groupIndex: number = 0): ViewRenderGroup[] {
		if (groupIndex >= this._groupby.length) {
			return [
				{
					group: null,
					articles: this._order(articles).map(({ title, resourcePath, linkPath, itemPath, otherProps }) => ({
						title,
						resourcePath,
						itemPath,
						linkPath,
						otherProps,
					})),
				},
			];
		}

		let groupedArticles = articles.reduce((acc, article) => {
			const groupValue = article.groupValues[groupIndex];
			const key = groupValue !== null && groupValue !== undefined ? String(groupValue) : "ungrouped";
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

		return Object.entries(groupedArticles).map(([groupKey, groupArticles]) => ({
			group: groupKey === "ungrouped" ? null : [groupKey],
			articles: [],
			subgroups: this._group(this._order(groupArticles), groupIndex + 1),
		}));
	}

	private _flattenGroups(groups: ViewRenderGroup[]): ViewRenderGroup[] {
		return groups?.map((group) => {
			if (group?.subgroups?.length === 0) {
				return {
					...group,
					articles: this._order(group.articles as ProcessedArticle[]),
				};
			}

			const flattenedSubgroups = this._flattenGroups(group.subgroups);

			return {
				...group,
				subgroups: flattenedSubgroups,
			};
		});
	}

	private async _handleDynamicProperty(
		article: Article | Category,
		prop: PropertyValue,
	): Promise<PreProcessedArticle[]> {
		if (prop?.name === (SystemProperties.hierarchy as string)) {
			if (article.type !== ItemType.category) return [];
			const processedItems = await Promise.all(
				(article as Category)?.items?.map(async (article: Article) => {
					const resourcePath = this._curArticle.ref.path.getRelativePath(article.ref.path).value;
					const extendedProperties =
						(article.props?.properties?.map((prop) => {
							const catalogProp = this._catalogPropMap.get(prop.name);
							return catalogProp ? { ...catalogProp, ...prop } : prop;
						}) as Property[]) ?? [];

					return {
						title: article.props.title,
						resourcePath,
						itemPath: article.ref.path.value,
						content: article.parsedContent?.editTree
							? astToParagraphs(article.parsedContent.editTree).slice(0, 5)
							: undefined,
						linkPath: await this._catalog.getPathname(article),
						groupValues: this._groupby.map((groupProp) => {
							const prop = extendedProperties.find((p) => p.name === groupProp);
							return prop?.value ?? prop?.name ?? null;
						}),
						otherProps: sortMapByName(
							Array.from(this._catalogPropMap.keys()),
							this._filterProps(extendedProperties),
						),
						extendedProperties,
					};
				}),
			);

			return processedItems;
		}
	}
}

export default ViewFilter;
