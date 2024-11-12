import { ViewRenderData } from "./index";

export interface Column {
	name: string;
	cards?: ViewRenderData[];
}

export enum DragItems {
	Card = "Card",
}
