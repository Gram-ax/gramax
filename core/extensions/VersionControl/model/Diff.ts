import { JSONContent } from "@tiptap/core";
import { FileStatus } from "../../Watchers/model/FileStatus";
import { DiffHunk } from "../DiffHandler/model/DiffHunk";

export interface DiffFilePaths {
	path: string;
	oldPath?: string;
	hunks?: DiffHunk[];
}

export interface DiffFile {
	type: "resource" | "item";
	status: FileStatus;
	filePath: DiffFilePaths;
	title: string;
	isChanged: boolean;
	content?: string;
	oldContent?: string;
	hunks?: DiffHunk[];
	added?: number;
	deleted?: number;
	isLfs: boolean;
	size: number;
}

export interface DiffResource extends DiffFile {
	type: "resource";
	parentPath?: DiffFilePaths;
}

export interface DiffItem extends DiffFile {
	type: "item";
	order: number;
	resources: DiffResource[];
	logicPath?: string;
	newEditTree?: JSONContent;
	oldEditTree?: JSONContent;
}

export interface DiffItemResourceCollection {
	items: DiffItem[];
	resources: DiffResource[];
}

export type WithMergeBase<T> = T & {
	mergeBase: string;
};

export type DiffItemOrResource = DiffItem | DiffResource;
