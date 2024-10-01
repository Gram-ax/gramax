export type GitRepData = { path: string; lastActivity: number };

export type GitRepsPageData = {
	repDatas: GitRepData[];
	page: number;
	totalPages: number;
	totalPathsCount: number;
};
