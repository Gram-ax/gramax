import { STANDARD_PAGE_WIDTH } from "@ext/wordExport/options/wordExportSettings";

const TWIPS_TO_EMU = 635;

export function fitIndentedContentWidth(doc: Document): void {
	const usableWidth = getUsableBodyWidth(doc) ?? STANDARD_PAGE_WIDTH;
	if (!usableWidth || usableWidth <= 0) return;

	scaleIndentedParagraphDrawings(doc, usableWidth);
	scaleIndentedTables(doc, usableWidth);
}

function getUsableBodyWidth(doc: Document): number | undefined {
	const sectPrs = doc.getElementsByTagName("w:sectPr");
	if (!sectPrs.length) return undefined;
	const sectPr = sectPrs[sectPrs.length - 1];
	const pgSz = sectPr.getElementsByTagName("w:pgSz")[0];
	const pgMar = sectPr.getElementsByTagName("w:pgMar")[0];
	const pageWidth = parseTwips(pgSz?.getAttribute("w:w"));
	if (!pageWidth || pageWidth <= 0) return undefined;
	const leftMargin = parseTwips(pgMar?.getAttribute("w:left")) ?? 0;
	const rightMargin = parseTwips(pgMar?.getAttribute("w:right")) ?? 0;
	const usable = pageWidth - leftMargin - rightMargin;
	return usable > 0 ? usable : undefined;
}

function scaleIndentedParagraphDrawings(doc: Document, usableWidthTwips: number): void {
	const paragraphs = Array.from(doc.getElementsByTagName("w:p"));
	for (const paragraph of paragraphs) {
		const drawings = paragraph.getElementsByTagName("w:drawing");
		if (!drawings.length) continue;
		const pPr = getParagraphProperties(paragraph);
		const indent = readIndentAttributes(pPr);
		const indentLeft = parseTwips(indent?.left);
		if (!indentLeft || indentLeft <= 0) continue;
		const available = usableWidthTwips - indentLeft;
		if (available <= 0) continue;
		scaleParagraphDrawings(paragraph, available);
	}
}

function scaleParagraphDrawings(paragraph: Element, availableWidthTwips: number): void {
	const availableWidthEmu = twipsToEmu(availableWidthTwips);
	if (!availableWidthEmu) return;
	const drawings = Array.from(paragraph.getElementsByTagName("w:drawing"));
	for (const drawing of drawings) {
		const inlineOrAnchor =
			drawing.getElementsByTagName("wp:inline")[0] ?? drawing.getElementsByTagName("wp:anchor")[0];
		if (!inlineOrAnchor) continue;
		const extent = inlineOrAnchor.getElementsByTagName("wp:extent")[0];
		if (!extent) continue;
		const width = parseInt(extent.getAttribute("cx") ?? "", 10);
		if (!width || width <= availableWidthEmu) continue;
		const height = parseInt(extent.getAttribute("cy") ?? "", 10);
		const ratio = availableWidthEmu / width;
		extent.setAttribute("cx", String(Math.max(1, Math.floor(width * ratio))));
		if (height > 0) {
			extent.setAttribute("cy", String(Math.max(1, Math.floor(height * ratio))));
		}
	}
}

function scaleIndentedTables(doc: Document, usableWidthTwips: number): void {
	const tables = Array.from(doc.getElementsByTagName("w:tbl"));
	for (const table of tables) {
		const tblInd = table.getElementsByTagName("w:tblInd")[0];
		if (!tblInd) continue;
		const indentLeft = parseTwips(tblInd.getAttribute("w:w"));
		if (!indentLeft || indentLeft <= 0) continue;
		const available = usableWidthTwips - indentLeft;
		if (available <= 0) continue;
		scaleTableWidth(table, available);
	}
}

function scaleTableWidth(table: Element, maxWidthTwips: number): void {
	const currentWidth = getTableWidth(table);
	if (!currentWidth || currentWidth <= maxWidthTwips) return;

	const ratio = maxWidthTwips / currentWidth;
	if (ratio >= 1) return;

	setTableWidth(table, Math.max(1, Math.floor(currentWidth * ratio)));
	scaleTableGrid(table, ratio);
	scaleTableCells(table, ratio);
}

function getTableWidth(table: Element): number | undefined {
	const tblPr = table.getElementsByTagName("w:tblPr")[0];
	const tblW = tblPr?.getElementsByTagName("w:tblW")[0];
	const width = parseTwips(tblW?.getAttribute("w:w"));
	if (width && width > 0) return width;

	const tblGrid = table.getElementsByTagName("w:tblGrid")[0];
	if (!tblGrid) return undefined;

	let total = 0;
	const gridCols = Array.from(tblGrid.getElementsByTagName("w:gridCol"));
	for (const col of gridCols) {
		const colWidth = parseTwips(col.getAttribute("w:w"));
		if (colWidth) total += colWidth;
	}

	return total || undefined;
}

function setTableWidth(table: Element, width: number): void {
	let tblPr = table.getElementsByTagName("w:tblPr")[0];
	if (!tblPr) {
		tblPr = table.ownerDocument.createElement("w:tblPr");
		table.insertBefore(tblPr, table.firstChild);
	}

	let tblW = tblPr.getElementsByTagName("w:tblW")[0];
	if (!tblW) {
		tblW = table.ownerDocument.createElement("w:tblW");
		tblPr.appendChild(tblW);
	}

	tblW.setAttribute("w:w", String(width));
	tblW.setAttribute("w:type", "dxa");
}

function scaleTableGrid(table: Element, ratio: number): void {
	const tblGrid = table.getElementsByTagName("w:tblGrid")[0];
	if (!tblGrid) return;

	const cols = Array.from(tblGrid.getElementsByTagName("w:gridCol"));
	for (const col of cols) {
		const width = parseTwips(col.getAttribute("w:w"));
		if (!width || width <= 0) continue;
		col.setAttribute("w:w", String(Math.max(1, Math.floor(width * ratio))));
	}
}

function scaleTableCells(table: Element, ratio: number): void {
	const cells = Array.from(table.getElementsByTagName("w:tc"));
	for (const cell of cells) {
		const tcPr = cell.getElementsByTagName("w:tcPr")[0];
		if (!tcPr) continue;
		const tcW = tcPr.getElementsByTagName("w:tcW")[0];
		if (!tcW) continue;
		const width = parseTwips(tcW.getAttribute("w:w"));
		if (!width || width <= 0) continue;
		tcW.setAttribute("w:w", String(Math.max(1, Math.floor(width * ratio))));
	}
}

function getParagraphProperties(paragraph: Element): Element | null {
	return paragraph.getElementsByTagName("w:pPr")[0] ?? null;
}

function readIndentAttributes(pPr: Element | null): { left?: string | null } | null {
	if (!pPr) return null;
	const indNode = pPr.getElementsByTagName("w:ind")[0];
	if (!indNode) return null;
	const left = indNode.getAttribute("w:left");
	if (!left) return null;
	return { left };
}

function parseTwips(value?: string | null): number | undefined {
	if (typeof value !== "string" || value.trim() === "") return undefined;
	const parsed = parseInt(value, 10);
	return Number.isNaN(parsed) ? undefined : parsed;
}

function twipsToEmu(valueTwips: number): number {
	return valueTwips <= 0 ? 0 : Math.max(0, Math.floor(valueTwips * TWIPS_TO_EMU));
}
