import { ViewRenderData } from "@ext/properties/models";

export interface TableRow {
	name?: string;
	rowSpan?: number;
	article?: ViewRenderData;
	itemPath?: string;
	width?: number;
}

export type TableCell = string | ViewRenderData;
