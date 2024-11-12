import getCountArticles from "@ext/markdown/elements/view/render/logic/getCountArticles";
import { ViewRenderGroup } from "@ext/properties/models";
import { TableCell, TableRow } from "@ext/properties/models/table";

const getArray = (group: ViewRenderGroup): TableCell[] => {
	const rows = [];
	let row = [];

	if (group?.group?.[0]) row.push({ name: group?.group?.[0], rowSpan: getCountArticles(group?.subgroups) ?? 1 });
	if (group?.subgroups?.length > 0) {
		group.subgroups.map((subgroup) => {
			row.push(...getArray(subgroup));
		});
	}
	if (group?.articles?.length > 0) {
		group.articles.forEach((article) => {
			row.push({ article }, "\n");
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

const getRenderRows = (group: ViewRenderGroup): Array<TableRow[]> => {
	return splitRows(getArray(group));
};

export default getRenderRows;
