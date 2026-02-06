import chat from "./chat";
import getIndexingProgress from "./getIndexingProgress";
import resetSearchData from "./resetSearchData";
import searchCommand from "./searchCommand";

const search = {
	resetSearchData,
	searchCommand,
	chat,
	getIndexingProgress,
};

export default search;
