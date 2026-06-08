/** biome-ignore-all lint/style/useNamingConvention: expected */
import type { OrderValue, ProcessedArticle } from "@ext/properties/logic/ViewFilter";
import { type Property, PropertyTypes, type ViewRenderGroup } from "@ext/properties/models";

class ViewSorter {
	protected _sortGroup(groups: ViewRenderGroup[], orderby: OrderValue[], groupName: string): ViewRenderGroup[] {
		return groups.sort((a, b) => {
			const prop = orderby.find((order) => order.id === groupName);
			if (!prop?.value?.length) return 0;

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

	protected _sortArticle(articles: ProcessedArticle[], orderby: OrderValue[]): ProcessedArticle[] {
		let sortedArticles = articles;
		for (const orderProp of orderby) {
			const { id, value: orderValues } = orderProp;
			sortedArticles = sortedArticles.sort((a, b) => {
				const aProp = a.otherProps.find((prop) => prop.id === id);
				const bProp = b.otherProps.find((prop) => prop.id === id);

				if (aProp?.id !== id && bProp?.id !== id) return 0;
				if (aProp?.id !== id) return 1;
				if (bProp?.id !== id) return -1;

				if (!aProp && !bProp) return 0;
				if (!aProp) return 1;
				if (!bProp) return -1;

				if (!aProp.value?.length && !bProp.value?.length) return 0;
				if (!aProp.value?.length) return 1;
				if (!bProp.value?.length) return -1;

				if (aProp.type === PropertyTypes.enum || aProp.type === PropertyTypes.many) {
					return this._sortByValues(aProp, bProp, orderValues);
				}

				if (aProp.type === PropertyTypes.date && bProp.type === PropertyTypes.date) {
					return this._sortByDate(aProp, bProp);
				}

				return this._sortOtherProps(aProp, bProp);
			});
		}

		return sortedArticles;
	}

	// For properties with initial values, we sort by the order of the values
	private _sortByValues(aProp: Property, bProp: Property, orderValues: string[]): number {
		const valuesOrder = orderValues?.length ? orderValues : (aProp.values ?? bProp.values);
		if (!valuesOrder?.length) return this._sortOtherProps(aProp, bProp);

		const aValue = Array.isArray(aProp.value) ? aProp.value.find((v) => valuesOrder.includes(v)) : aProp.value;
		const bValue = Array.isArray(bProp.value) ? bProp.value.find((v) => valuesOrder.includes(v)) : bProp.value;

		if (!aValue && !bValue) return 0;
		if (!aValue) return 1;
		if (!bValue) return -1;

		const aIndex = valuesOrder.indexOf(aValue);
		const bIndex = valuesOrder.indexOf(bValue);

		if (aIndex !== bIndex) {
			const comparison = aIndex - bIndex;
			if (comparison !== 0) return comparison;
		}

		return 0;
	}

	// For properties without initial values, we sort by the first value
	private _sortOtherProps(aProp: Property, bProp: Property): number {
		const aValue = aProp.value?.[0];
		const bValue = bProp.value?.[0];

		if (!aValue && !bValue) return 0;
		if (!aValue) return 1;
		if (!bValue) return -1;

		if (aValue === bValue) return 0;
		if (aValue < bValue) return 1;
		if (aValue > bValue) return -1;

		return 0;
	}

	private _sortByDate(aProp: Property, bProp: Property): number {
		const aValue = new Date(aProp.value?.[0]);
		const bValue = new Date(bProp.value?.[0]);

		if (!aValue && !bValue) return 0;
		if (!aValue) return 1;

		if (aValue === bValue) return 0;
		if (aValue < bValue) return -1;
		if (aValue > bValue) return 1;

		return 0;
	}
}

export default ViewSorter;
