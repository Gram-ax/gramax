import { Content, TableCellProperties } from "pdfmake/interfaces";

export interface TableCell extends TableCellProperties {
	text?: string;
	bold?: boolean;
	margin?: [number, number, number, number];
	stack?: Content[];
}

export type TableRow = TableCell[];
export type TableBody = TableRow[];
