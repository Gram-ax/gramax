import type { PropertyValue, ViewRenderData, ViewRenderGroup } from "@ext/properties/models";

export interface MoveCardParams {
	data: ViewRenderGroup[];
	columnID: number;
	cardID: number;
	newColumnID: number;
	groupbyProperty: string;
	defs?: PropertyValue[];
	isDelete?: boolean;
	selectedValue?: string;
}

export interface MoveCardResult {
	data: ViewRenderGroup[];
	newValue: string;
	isDelete: boolean;
	isFilteredOut: boolean;
}

const isValueFilteredOut = (defs: PropertyValue[] | undefined, groupbyProperty: string, value: string): boolean => {
	if (!defs?.length || !value) return false;
	const def = defs.find((d) => d.id === groupbyProperty);

	if (!def?.value?.length) return false;
	return def.value.includes(value);
};

const moveCardBetweenColumns = (
	data: ViewRenderGroup[],
	sourceColumnIndex: number,
	cardIndex: number,
	targetColumnIndex: number,
	article: ViewRenderData,
): ViewRenderGroup[] => {
	return data.map((grp, index) => {
		if (index === sourceColumnIndex) {
			const subgroup = grp.subgroups![0];
			const articles = subgroup.articles.filter((_, i) => i !== cardIndex);
			return { ...grp, subgroups: [{ ...subgroup, articles }] };
		}

		if (index === targetColumnIndex) {
			const subgroup = grp.subgroups![0];
			const articles = [...subgroup.articles, article];
			return { ...grp, subgroups: [{ ...subgroup, articles }] };
		}

		return grp;
	});
};

const createColumnWithArticle = (name: string, article: ViewRenderData): ViewRenderGroup => {
	return {
		group: [name],
		articles: [article],
		subgroups: [{ group: [name], articles: [article] }],
	};
};

const applyGroupbyValueToArticle = (
	sourceArticle: ViewRenderData,
	groupbyProperty: string,
	newValue: string,
	isDelete: boolean,
): ViewRenderData => {
	const indexProperty = sourceArticle.otherProps.findIndex((prop) => prop.name === groupbyProperty);
	if (indexProperty === -1 || !sourceArticle.otherProps?.length) return { ...sourceArticle };

	const otherProps = sourceArticle.otherProps.map((prop, i) =>
		i === indexProperty ? { ...prop, value: isDelete || !newValue ? [] : [newValue] } : prop,
	);
	return { ...sourceArticle, otherProps };
};

const moveCardInKanban = (params: MoveCardParams): MoveCardResult => {
	const { data, columnID, cardID, newColumnID, groupbyProperty, defs, isDelete, selectedValue } = params;

	const group = data[columnID]?.subgroups?.[0];
	const sourceArticle = group?.articles[cardID];
	if (!group || !sourceArticle) return { data, newValue: "", isDelete: false, isFilteredOut: false };

	const targetGroup = data[newColumnID];
	const newValue = targetGroup?.group?.[0] ?? (newColumnID < 0 ? selectedValue : undefined) ?? "";
	const filteredOut = isValueFilteredOut(defs, groupbyProperty, selectedValue ?? "");
	const shouldAddColumn = newColumnID >= 0 || (newColumnID < 0 && !!selectedValue && !filteredOut);
	const effectiveIsDelete = isDelete || (newColumnID < 0 && !selectedValue);

	const shouldRemoveFromUI = effectiveIsDelete || filteredOut;
	const article = applyGroupbyValueToArticle(sourceArticle, groupbyProperty, newValue, effectiveIsDelete);

	let newData: ViewRenderGroup[];
	if (shouldAddColumn && !shouldRemoveFromUI) {
		if (newColumnID >= 0 && newColumnID < data.length) {
			newData = moveCardBetweenColumns(data, columnID, cardID, newColumnID, article);
		} else if (newColumnID < 0) {
			const dataWithoutCard = data.map((grp, index) => {
				if (index !== columnID) return grp;
				const subgroup = grp.subgroups![0];
				const articles = subgroup.articles.filter((_, i) => i !== cardID);
				return { ...grp, subgroups: [{ ...subgroup, articles }] };
			});
			const newGroup = createColumnWithArticle(selectedValue!, article);
			newData = [...dataWithoutCard, newGroup];
		} else {
			newData = data.map((grp, index) => {
				if (index !== columnID) return grp;
				const subgroup = grp.subgroups![0];
				const articles = subgroup.articles.filter((_, i) => i !== cardID);
				return { ...grp, subgroups: [{ ...subgroup, articles }] };
			});
		}
	} else {
		newData = data.map((grp, index) => {
			if (index !== columnID) return grp;
			const subgroup = grp.subgroups![0];
			const articles = subgroup.articles.filter((_, i) => i !== cardID);

			return { ...grp, subgroups: [{ ...subgroup, articles }] };
		});
	}

	return {
		data: newData,
		newValue,
		isDelete: effectiveIsDelete,
		isFilteredOut: filteredOut,
	};
};

export default moveCardInKanban;
