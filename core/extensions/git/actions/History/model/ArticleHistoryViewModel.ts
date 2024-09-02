import { Change } from "../../../../VersionControl/DiffHandler/model/Change";

export interface ArticleHistoryViewModel {
	version: string;
	author: string;
	date: string;
	content: Change[];
	filePath: {
		path: string;
		oldPath?: string;
		diff?: Change[];
	};
}
