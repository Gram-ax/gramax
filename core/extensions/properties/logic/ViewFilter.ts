import { Article } from "@core/FileStructue/Article/Article";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import { Category } from "@core/FileStructue/Category/Category";
import sortMapByName from "@ext/markdown/elements/view/render/logic/sortMap";
import getAllCatalogProperties from "@ext/properties/logic/getAllCatalogProps";
import getDisplayValue from "@ext/properties/logic/getDisplayValue";
import { Property, PropertyValue, SystemProperties, ViewRenderGroup } from "@ext/properties/models";
import { Display } from "@ext/properties/models/displays";

interface ProcessedArticle {
	title: string;
	resourcePath: string;
	linkPath: string;
	itemPath: string;
	otherProps: Property[];
	groupValues: (string | string[])[];
}

export type OrderValue = { name: string; value: string[] };

class ViewFilter {
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
	) {}

	public async getFilteredArticles(): Promise<ViewRenderGroup[]> {
		const groups = this._group(await this._filter());
		return this._flattenGroups(groups);
	}

	private async _filter(): Promise<ProcessedArticle[]> {
		this._catalogPropMap = new Map(getAllCatalogProperties(this._catalog).map((prop) => [prop.name, prop]));

		const processedArticles = [];
		const uniqueArticles = new Set<string>();

		processedArticles.push(...(await this._handleSystemProperty(uniqueArticles)));
		processedArticles.push(
			...(await Promise.all(
				this._articles
					.filter((article) =>
						this._defs.every((defProp) => {
							const articleProp = article.props?.properties?.find((p) => p.name === defProp.name);
							if (articleProp && defProp?.value?.some((val) => articleProp.value?.includes(val)))
								return false;

							if (defProp?.value?.includes("yes")) return !articleProp;
							if (defProp?.value?.includes("none")) return !!articleProp;
							if (uniqueArticles.has(article?.ref?.path?.value)) return false;

							return true;
						}),
					)
					.map(async (article) => {
						return await this._proccessArticle(article, (refPath) => uniqueArticles.add(refPath));
					}),
			)),
		);

		return processedArticles;
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
			otherProps: sortMapByName(Array.from(this._catalogPropMap.keys()), this._filterProps(extendedProperties)),
		};
	}

	private _orderArticles(articles: ProcessedArticle[]): ProcessedArticle[] {
		let sortedArticles = articles;
		for (const orderProp of this._orderby) {
			const { name, value: orderValues } = orderProp;
			sortedArticles = sortedArticles.sort((a, b) => {
				const aProp = a.otherProps.find((prop) => prop.name === name);
				const bProp = b.otherProps.find((prop) => prop.name === name);

				if (aProp?.name !== name && bProp?.name !== name) return 0;
				if (aProp?.name !== name) return 1;
				if (bProp?.name !== name) return -1;

				if (!aProp && !bProp) return 0;
				if (!aProp) return 1;
				if (!bProp) return -1;

				if (!aProp.value?.length && !bProp.value?.length) return 0;
				if (!aProp.value?.length) return 1;
				if (!bProp.value?.length) return -1;

				const aValue = Array.isArray(aProp.value)
					? aProp.value.find((v) => orderValues.includes(v))
					: aProp.value;
				const bValue = Array.isArray(bProp.value)
					? bProp.value.find((v) => orderValues.includes(v))
					: bProp.value;

				if (!aValue && !bValue) return 0;
				if (!aValue) return 1;
				if (!bValue) return -1;

				const aIndex = orderValues.indexOf(aValue);
				const bIndex = orderValues.indexOf(bValue);

				if (aIndex !== bIndex) {
					const comparison = aIndex - bIndex;
					if (comparison !== 0) return comparison;
				}

				return 0;
			});
		}

		return sortedArticles;
	}

	private _orderGroup(groups: ViewRenderGroup[], groupProp: string): ViewRenderGroup[] {
		return groups.sort((a, b) => {
			const prop = this._orderby.find((order) => order.name === groupProp);
			if (!prop) return 0;
			const aName = a.group?.[0];
			const bName = b.group?.[0];

			if (!aName && !bName) return 0;
			if (!aName) return 1;
			if (!bName) return -1;

			const aIndex = prop.value.indexOf(aName);
			const bIndex = prop.value.indexOf(bName);

			if (aIndex === bIndex) return 0;
			if (aIndex !== bIndex) {
				const comparison = aIndex - bIndex;
				if (comparison !== 0) return comparison;
			}

			return 0;
		});
	}

	private _group(articles: ProcessedArticle[], groupIndex: number = 0): ViewRenderGroup[] {
		if (groupIndex >= this._groupby.length) {
			return [
				{
					group: null,
					articles: this._orderArticles(articles).map(
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
			const key =
				groupValue !== null && groupValue !== undefined
					? getDisplayValue(groupValueType, groupValue)
					: "ungrouped";
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
			subgroups: this._group(this._orderArticles(groupArticles), groupIndex + 1),
		}));

		return this._orderGroup(groups, this._groupby[groupIndex]);
	}

	private _flattenGroups(groups: ViewRenderGroup[]): ViewRenderGroup[] {
		return groups?.map((group) => {
			if (group?.subgroups?.length === 0) {
				return {
					...group,
					articles: this._orderArticles(group.articles as ProcessedArticle[]),
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
		const hierarchyDef = this._defs.find((property) => SystemProperties[property.name]);
		if (hierarchyDef) {
			if (!hierarchyDef.value.includes("child-to-current"))
				return await Promise.all(
					((this._curArticle as Category)?.items || [])
						?.filter((article) => !uniqueArticles.has(article.ref.path.value))
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
		}

		return [];
	}
}

export default ViewFilter;
