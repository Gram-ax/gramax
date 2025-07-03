import { AlignEnumTypes } from "@ext/markdown/elements/table/edit/model/tableTypes";
import { Content, TableCellProperties } from "pdfmake/interfaces";

export interface TableCell extends TableCellProperties {
	text?: string;
	bold?: boolean;
	margin?: [number, number, number, number];
	stack?: Content[];
	alignment?: AlignEnumTypes;
}

export type TableRow = TableCell[];
export type TableBody = TableRow[];
