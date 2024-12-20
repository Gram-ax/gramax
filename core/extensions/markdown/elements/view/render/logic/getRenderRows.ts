import getCountArticles from "@ext/markdown/elements/view/render/logic/getCountArticles";
import getDisplayValue from "@ext/properties/logic/getDisplayValue";
import { ViewRenderGroup } from "@ext/properties/models";
import { TableCell, TableRow } from "@ext/properties/models/table";

const getArray = (group: ViewRenderGroup, select: string[]): TableCell[] => {
	const rows = [];
	let row = [];

	if (group?.group?.length > 0)
		row.push({
			name: group?.group?.[0] !== null ? group?.group?.[0] : "",
			rowSpan: getCountArticles(group?.subgroups) ?? 1,
		});
	if (group?.subgroups?.length > 0) {
		group.subgroups.map((subgroup) => {
			row.push(...getArray(subgroup, select));
		});
	}
	if (group?.articles?.length > 0) {
		group.articles.forEach((article) => {
			const cells = select.map((name) => {
				const property = article.otherProps.find((prop) => prop.name === name);

				if (!property) return { name: "", rowSpan: 1 };
				return {
					name: getDisplayValue(property.type, property.value),
					rowSpan: 1,
				};
			});
			row.push({ article }, ...cells, "\n");
			rows.push(...row);
			row = [];
		});
	}

	rows.push(...row);
	return rows;
};

const splitRows = (rows: TableCell[]) => {
	const result = [];
	let currentGroup = [];

	for (const item of rows) {
		if (item === "\n") {
			if (currentGroup.length > 0) {
				result.push(currentGroup);
				currentGroup = [];
			}
		} else {
			currentGroup.push(item);
		}
	}

	if (currentGroup.length > 0) {
		result.push(currentGroup);
	}

	return result;
};

const getRenderRows = (group: ViewRenderGroup, select: string[]): Array<TableRow[]> => {
	return splitRows(getArray(group, select));
};

export default getRenderRows;
