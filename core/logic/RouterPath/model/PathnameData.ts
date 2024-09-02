import type { ContentLanguage } from "@ext/localization/core/model/Language";

interface BasePathnameData {
	sourceName: string;
	group: string;
	repName: string;
	branch: string;
	catalogName: string;
	filePath: string[];
	language: ContentLanguage;
	hash: string;
	itemLogicPath: string[];
	repNameItemLogicPath: string[];
}

type PathnameData = Partial<BasePathnameData>;

export default PathnameData;
