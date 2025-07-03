import getCountArticles from "@ext/markdown/elements/view/render/logic/getCountArticles";
import getDisplayValue from "@ext/properties/logic/getDisplayValue";
import { Property, PropertyTypes, ViewRenderGroup } from "@ext/properties/models";
import { TableCell, TableRow } from "@ext/properties/models/table";

const getWidth = (property: Property) => {
	if (property.type === PropertyTypes.blockMd) return "20em";
	if (property.type === PropertyTypes.text) return "5em";
	return undefined;
};

const getArray = (group: ViewRenderGroup, select: string[], catalogProperties: Map<string, Property>): TableCell[] => {
	const rows = [];
	let row = [];

	if (group?.group?.length > 0)
		row.push({
			name: group?.group?.[0] !== null ? group?.group?.[0] : "",
			rowSpan: getCountArticles(group?.subgroups) ?? 1,
		});
	if (group?.subgroups?.length > 0) {
		group.subgroups.map((subgroup) => {
			row.push(...getArray(subgroup, select, catalogProperties));
		});
	}
	if (group?.articles?.length > 0) {
		group.articles.forEach((article) => {
			const cells = select.map((name) => {
				const catalogProperty = catalogProperties.get(name);
				const property = article.otherProps.find((prop) => prop.name === name);

				if (!property && !catalogProperty) return { name: "", rowSpan: 1 };
				return {
					name: getDisplayValue(catalogProperty?.type, property?.value, Boolean(property)),
					itemPath: article.itemPath,
					rowSpan: 1,
					width: getWidth(catalogProperty),
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

const getRenderRows = (
	group: ViewRenderGroup,
	select: string[],
	catalogProperties: Map<string, Property>,
): Array<TableRow[]> => {
	return splitRows(getArray(group, select, catalogProperties));
};

export default getRenderRows;
