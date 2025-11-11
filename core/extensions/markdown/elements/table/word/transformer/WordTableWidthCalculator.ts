import { JSONContent } from "@tiptap/core";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { STANDARD_PAGE_WIDTH } from "@ext/wordExport/options/wordExportSettings";

export const TWIPS_PER_PIXEL = 15;

export interface TableWidthContext {
	columnsCount: number;
	columnUnits: number[];
	defaultColumnWidth: number;
	sumColumnWidthTwips: number;
	contractionCoefficient: number;
	maxTableWidth: number;
}

export interface TableCellAttributes {
	colspan?: unknown;
	colwidth?: unknown;
}

type TableNode = Tag | JSONContent;

export const buildTableWidthContext = (table: TableNode, maxTableWidth?: number): TableWidthContext => {
	const targetWidth = maxTableWidth ?? STANDARD_PAGE_WIDTH;
	const columnsCount = Math.max(getColumnsCount(table), 1);
	const defaultColumnWidth = Math.floor(targetWidth / columnsCount);
	const columnUnits = collectColumnWidthUnits(table, columnsCount);
	const baseColumnWidths = columnUnits.map((unit) =>
		unit > 0 ? unit * TWIPS_PER_PIXEL : defaultColumnWidth,
	);
	const sumColumnWidthTwips = baseColumnWidths.reduce((sum, width) => sum + width, 0);
	const contractionCoefficient =
		sumColumnWidthTwips > targetWidth ? targetWidth / sumColumnWidthTwips : 1;

	return {
		columnsCount,
		columnUnits,
		defaultColumnWidth,
		sumColumnWidthTwips,
		contractionCoefficient,
		maxTableWidth: targetWidth,
	};
};

export const getColumnWidthsTwips = (context: TableWidthContext): number[] => {
	return context.columnUnits.map((unit) => {
		const base = unit > 0 ? unit * TWIPS_PER_PIXEL : context.defaultColumnWidth;
		return base * context.contractionCoefficient;
	});
};

export const calculateCellBaseWidthTwips = (
	attributes: TableCellAttributes | undefined,
	context: TableWidthContext,
): number => {
	if (!attributes) {
		return context.defaultColumnWidth;
	}

	const span = getSpan(attributes.colspan);
	const normalizedColwidth = normalizeColwidth(attributes.colwidth, span);
	const hasExplicitWidth = normalizedColwidth.some((value) => value > 0);

	if (hasExplicitWidth) {
		return normalizedColwidth.reduce(
			(sum, value) => sum + value * TWIPS_PER_PIXEL,
			0,
		);
	}

	return span * context.defaultColumnWidth;
};

const getColumnsCount = (table: TableNode): number => {
	const sections = "children" in table ? table.children : table.content;
	const firstSection = sections?.find((child) => child && typeof child !== "string");
	const rows = firstSection && "children" in firstSection ? firstSection.children : firstSection?.content;
	let maxCols = 0;

	for (const row of rows ?? []) {
		if (!row || typeof row === "string") continue;
		const cells = row.children ?? [];
		let rowCols = 0;

		for (const cell of cells) {
			if (!cell || typeof cell === "string") continue;
			const attrs = "attributes" in cell ? cell.attributes : cell.attrs;
			rowCols += getSpan(attrs?.colspan);
		}

		maxCols = Math.max(maxCols, rowCols);
	}

	return maxCols;
};

const collectColumnWidthUnits = (table: TableNode, columnsCount: number): number[] => {
	const units = new Array<number>(columnsCount).fill(0);
	const sections = "children" in table ? table.children : table.content;

	for (const section of sections ?? []) {
		if (!section || typeof section === "string") continue;
		const rows = "children" in section ? section.children : section.content;

		for (const row of rows ?? []) {
			if (!row || typeof row === "string") continue;
			const cells = row.children ?? [];
			let columnIndex = 0;

			for (const cell of cells) {
				if (!cell || typeof cell === "string") continue;
				const attrs = "attributes" in cell ? cell.attributes : cell.attrs;
				const span = getSpan(attrs?.colspan);
				const normalized = normalizeColwidth(attrs?.colwidth, span);

				for (let i = 0; i < span && columnIndex + i < columnsCount; i++) {
					const value = normalized[i];
					if (value > 0) units[columnIndex + i] = Math.max(units[columnIndex + i], value);
				}

				columnIndex += span;
			}
		}
	}

	return units;
};

const normalizeColwidth = (colwidth: unknown, span: number): number[] => {
	if (!Array.isArray(colwidth) || colwidth.length === 0) return new Array<number>(span).fill(0);

	return Array.from({ length: span }, (_, index) => {
		const raw = colwidth[Math.min(index, colwidth.length - 1)];
		const width = typeof raw === "number" ? raw : parseFloat(raw);
		return Number.isFinite(width) && width > 0 ? width : 0;
	});
};

const getSpan = (spanRaw: unknown): number => {
	const spanNumber = Number(spanRaw);
	return Number.isFinite(spanNumber) && spanNumber > 0 ? spanNumber : 1;
};
