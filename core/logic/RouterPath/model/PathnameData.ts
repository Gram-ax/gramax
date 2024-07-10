interface BasePathnameData {
	sourceName: string;
	group: string;
	repName: string;
	branch: string;
	catalogName: string;
	filePath: string[];
	hash: string;
	itemLogicPath: string[];
	repNameItemLogicPath: string[];
}

type PathnameData = Partial<BasePathnameData>;

export default PathnameData;
