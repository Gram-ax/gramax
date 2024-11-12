export type DiffItemType = "added" | "deleted" | "changedContext";

export interface DiffItemDiffContent {
	from: number;
	to: number;
	type: DiffItemType;
}

export type DiffNode = {
	path: string;
	block: boolean;
	diffType: DiffItemType;
	relativeFrom?: number;
	relativeTo?: number;
};
