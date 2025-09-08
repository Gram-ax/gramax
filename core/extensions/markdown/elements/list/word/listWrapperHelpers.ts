import {
	Paragraph,
	TextRun,
	Table as DocxTable,
	TableRow,
	TableCell,
	WidthType,
	VerticalAlign,
	TableBorders,
	TableLayoutType,
} from "docx";
import { WrapperMetrics } from "@ext/wordExport/lists/listMetrics";

export function separatorParaAfterTable() {
	return new Paragraph({
		spacing: { before: 0, after: 0 },
		children: [new TextRun({ text: "", size: 1 })],
	});
}

export function buildListWrapperTable(
	inner: any,
	numbering: { reference: string; level: number; instance?: number },
	metrics: WrapperMetrics,
): DocxTable {
	const numberingConfig = numbering.reference
		? {
				numbering: {
					reference: numbering.reference,
					level: numbering.level,
					...(typeof numbering.instance === "number" ? { instance: numbering.instance } : {}),
				},
		  }
		: {};

	const numberPara = new Paragraph({
		children: [new TextRun("")],
		...numberingConfig,
		spacing: { before: 0, after: 0 },
		indent: { left: 0, hanging: 0, firstLine: 0 },
		keepNext: true,
	});

	return new DocxTable({
		indent: { size: metrics.indent, type: WidthType.DXA },
		borders: TableBorders.NONE,
		columnWidths: [metrics.leftCellWidth, metrics.rightCellWidth],
		layout: TableLayoutType.FIXED,
		rows: [
			new TableRow({
				cantSplit: true,
				children: [
					new TableCell({
						verticalAlign: VerticalAlign.TOP,
						borders: TableBorders.NONE,
						margins: { top: 0, bottom: 0, left: 0, right: 0 },
						width: { size: metrics.leftCellWidth, type: WidthType.DXA },
						children: [numberPara],
					}),
					new TableCell({
						verticalAlign: VerticalAlign.TOP,
						borders: TableBorders.NONE,
						margins: { top: 0, bottom: 0, left: 0, right: 0 },
						children: Array.isArray(inner) ? inner : [inner],
					}),
				],
			}),
		],
	});
}
