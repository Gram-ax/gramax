export enum PartType {
	Normal = "normal",
	Conflict = "conflict",
}

interface Part {
	type: PartType;
	content: string;
}

export interface Normal extends Part {
	type: PartType.Normal;
}

export interface Conflict extends Part {
	type: PartType.Conflict;
	resolved: boolean;
	topPart: string;
	bottomPart: string;
	isTopPart: boolean;
}
