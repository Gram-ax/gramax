import type { DiffHunk } from "../../../../VersionControl/DiffHandler/model/DiffHunk";

export interface ArticleHistoryViewModel {
	version: string;
	author: string;
	date: string;
	content: DiffHunk[];
	filePath: {
		path: string;
		oldPath?: string;
		diff?: DiffHunk[];
	};
}

export interface OffsetDataLoader<T> {
	items: T[];
	nextOffset: number;
	hasMore: boolean;
}
