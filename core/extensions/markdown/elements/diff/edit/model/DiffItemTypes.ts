export type DiffItemType = "added" | "deleted" | "changedContext";

export type DiffNode = AddedDiffNode | DeletedDiffNode | ChangedContextDiffNode;

type AnyDiffNode = {
	path: string;
	block: boolean;
	diffType: DiffItemType;
	relativeFrom?: number;
	relativeTo?: number;
};

export interface AddedDiffNode extends AnyDiffNode {
	diffType: "added";
	deletedDiffNode?: DeletedDiffNode;
}

export interface DeletedDiffNode extends AnyDiffNode {
	diffType: "deleted";
	addedDiffNode?: AddedDiffNode;
}

export interface ChangedContextDiffNode extends AnyDiffNode {
	diffType: "changedContext";
	oldContentPath?: string;
}
