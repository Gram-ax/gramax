import { Paragraph, Table, TableCell, TableRow, TextRun, WidthType, convertMillimetersToTwip } from "docx";
import { WordBlockChild } from "../../../../wordExport/WordTypes";
import { createEmptyTextRun, createParagraphBeforeTable } from "@ext/wordExport/TextWordGenerator";
import { TableType, marginsType, wordBoardersType } from "@ext/wordExport/wordExportSettings";

export const fenceWordLayout: WordBlockChild = async ({ tag }) => {
	const lines = tag.attributes.value.split("\n");

	const textRuns = lines.map((text, index) => {
		return new TextRun({
			text,
			break: index < lines.length - 1 && index > 0 ? 1 : 0,
		});
	});

	const paragraph = new Paragraph({ children: textRuns, style: "fence" });
	const cell = new TableCell({ children: [paragraph], borders: wordBoardersType[TableType.fence] });
	const rows = [new TableRow({ children: [cell] })];
	const width = { size: 100, type: WidthType.PERCENTAGE };
	const table = new Table({ rows, width, margins: marginsType[TableType.fence] });

	return await Promise.resolve([createParagraphBeforeTable(), table, createEmptyParagraph(0)]);
};

const createEmptyParagraph = (indentMillimeters) => {
	const children = [createEmptyTextRun()];
	const indent = { left: convertMillimetersToTwip(indentMillimeters) };

	return new Paragraph({ children, indent });
};
