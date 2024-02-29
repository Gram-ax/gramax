interface BasePathnameData {
	sourceName: string;
	group: string;
	repName: string;
	branch: string;
	catalogName: string;
	filePath: string[];
	itemLogicPath: string[];
}

type PathnameData = Partial<BasePathnameData>;

export default PathnameData;
