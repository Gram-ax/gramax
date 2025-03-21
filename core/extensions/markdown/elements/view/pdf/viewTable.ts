import t from "@ext/localization/locale/translate";
import { getViewArticleItem } from "@ext/markdown/elements/view/pdf/view";
import { COLOR_CONFIG } from "@ext/pdfExport/config";
import { pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import { ViewRenderGroup } from "@ext/properties/models";
import { Content } from "pdfmake/interfaces";

interface TableCell {
	text: string | Content;
	rowSpan?: number;
	colSpan?: number;
}

export const getTableWithoutGrouping = (group: ViewRenderGroup, context: pdfRenderContext): Content => {
	const headerRow = [{ text: t("article2"), bold: true }];

	const bodyRows = group.articles.map((article) => {
		return [getViewArticleItem(article, context)];
	});

	return {
		table: {
			headerRows: 1,
			widths: ["auto"],
			body: [headerRow, ...bodyRows],
		},
		layout: TABLE_LAYOUT,
	};
};

export const getTableWithGrouping = (
	data: ViewRenderGroup[],
	context: pdfRenderContext,
	groupby: string[],
): Content => {
	const headers = createTableHeaders(groupby);

	const body = createTableBody(data, context);

	body.unshift(headers);

	const table: Content = {
		table: {
			body: body,
		},
		layout: TABLE_LAYOUT,
	};

	return table;
};

const createTableHeaders = (groupby: string[]): Content[] => {
	return groupby.map((key) => ({ text: key, bold: true })).concat({ text: t("article2"), bold: true });
};

const createTableBody = (data: ViewRenderGroup[], context: pdfRenderContext): Content[][] => {
	return data.flatMap((group) => processGroupForTable(group, context, group.group || []));
};

const processGroupForTable = (
	group: ViewRenderGroup,
	context: pdfRenderContext,
	currentGroupValues: (string | null)[] = [],
): TableCell[][] => {
	const rows: TableCell[][] = [];

	if (group.articles?.length > 0) {
		group.articles.forEach((article) => {
			const articleItem = getViewArticleItem(article, context);
			const rowValues: (string | Content | null)[] = [...currentGroupValues, articleItem];

			const newRow: TableCell[] = rowValues.map((value) => ({
				text: value || "",
				rowSpan: 1,
			}));

			rows.push(newRow);
		});
	}

	if (group.subgroups?.length > 0) {
		group.subgroups.forEach((subgroup) => {
			const subgroupValues = [...currentGroupValues, ...(subgroup.group || [])];
			rows.push(...processGroupForTable(subgroup, context, subgroupValues));
		});
	}

	if (rows.length > 0) {
		for (let colIndex = 0; colIndex < rows[0].length; colIndex++) {
			let count = 1;
			for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
				if (rows[rowIndex][colIndex].text === rows[rowIndex - 1][colIndex].text) {
					count++;
					rows[rowIndex][colIndex] = { text: "", rowSpan: 0 };
				} else {
					if (count > 1) {
						rows[rowIndex - count][colIndex].rowSpan = count;
					}
					count = 1;
				}
			}
			if (count > 1) {
				rows[rows.length - count][colIndex].rowSpan = count;
			}
		}
	}

	return rows;
};

const TABLE_LAYOUT = {
	hLineWidth: (rowIndex, _node) =>
		rowIndex === 0 || (_node.table.body && rowIndex === _node.table.body.length) ? 0 : 0.1,
	vLineWidth: (colIndex, _node) =>
		colIndex === 0 || (_node.table.widths && colIndex === _node.table.widths.length) ? 0 : 0.1,
	hLineColor: () => COLOR_CONFIG.table,
	vLineColor: () => COLOR_CONFIG.table,
	paddingLeft: () => 8,
	paddingRight: () => 8,
	paddingTop: () => 10,
	paddingBottom: () => 10,
};
