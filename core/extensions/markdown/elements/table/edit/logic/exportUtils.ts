import t from "@ext/localization/locale/translate";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import {
	getAggregatedValue,
	getFormattedValue,
	getFormatter,
} from "@ext/markdown/elements/table/edit/logic/aggregation";
import { AggregationMethod, AlignEnumTypes } from "@ext/markdown/elements/table/edit/model/tableTypes";
import { JSONContent } from "@tiptap/core";

const getColumn = (rows: (Tag | JSONContent)[], columnID: number) => {
	const columnCells: (Tag | JSONContent)[] = [];

	for (const row of rows) {
		if (!row || typeof row === "string") continue;

		const cells = "children" in row ? row.children : row.content;
		let currentColumn = 0;

		for (const cell of cells) {
			if (!cell || typeof cell === "string") continue;

			const cellAttributes = "attributes" in cell ? cell.attributes : cell.attrs;
			const colspan = cellAttributes.colspan || 1;

			if (currentColumn <= columnID && columnID < currentColumn + colspan) {
				columnCells.push(cell);
				break;
			}

			currentColumn += colspan;
		}
	}

	return columnCells;
};

export const aggregateTable = (rows: (Tag | JSONContent)[]) => {
	const firstRowChildren = "children" in rows[0] ? rows[0].children : rows[0].content;
	const columnsAggregation = firstRowChildren.map((cell) => {
		const attrs = "attributes" in cell ? cell.attributes : cell.attrs;

		return attrs.aggregation;
	});

	if (!columnsAggregation.filter(Boolean).length) return;
	const aggregateRow = new Tag("tr", {}, []);

	const formatter = getFormatter();
	columnsAggregation.forEach((type: AggregationMethod, index) => {
		if (!type) return aggregateRow.children.push(new Tag("td", {}, [new Tag("p", {}, [])]));
		const cells = getColumn(rows, index);
		const texts = cells
			.map((cell) => {
				const firstChild: Tag | JSONContent = "children" in cell ? cell.children[0] : cell.content[0];

				return "children" in firstChild ? firstChild.children[0] : firstChild.content[0].text;
			})
			.filter(Boolean);

		const aggregatedValue = getAggregatedValue(type, texts);
		const formattedValue = getFormattedValue(formatter, aggregatedValue);
		const cell = new Tag("td", {}, [
			new Tag("p", {}, [`${t(`editor.table.aggregation.methods.${type}.name`)}: ${formattedValue}`]),
		]);

		aggregateRow.children.push(cell);
	});

	rows.push(aggregateRow);
};

export const setCellAlignment = (rows: (Tag | JSONContent)[]) => {
	const firstRowChildren = "children" in rows[0] ? rows[0].children : rows[0].content;
	const columnsAlignment: string[] = firstRowChildren.map((cell) => {
		const attrs = "attributes" in cell ? cell.attributes : cell.attrs;

		return attrs.align;
	});

	if (!columnsAlignment.filter(Boolean).length) return;

	columnsAlignment.forEach((type: AlignEnumTypes, index) => {
		if (!type) return;
		const cells = getColumn(rows, index);

		cells.forEach((cell) => {
			const attrs = "attributes" in cell ? cell.attributes : cell.attrs;
			attrs.align = type;
		});
	});
};
