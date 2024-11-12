import { ViewRenderData } from "@ext/properties/models";

export interface TableRow {
	name?: string;
	rowSpan?: number;
	article?: ViewRenderData;
}

export type TableCell = string | ViewRenderData;
