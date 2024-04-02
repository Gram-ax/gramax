import create from "./create";
import app from "./editOn/app";
import source from "./editOn/source";
import checkLastModified from "./features/checkLastModified";
import getBrotherFileNames from "./features/getBrotherFileNames";
import getContent from "./features/getContent";
import getCustomArticle from "./features/getCustomArticle";
import getLinkItems from "./features/getLinkItems";
import getRenderContent from "./features/getRenderContent";
import setContent from "./features/setContent";
import getProps from "./getProps";
import get from "./resource/get";
import getNames from "./resource/getNames";
import remove from "./resource/remove";
import set from "./resource/set";
import updateContent from "./updateContent";

const article = {
	features: {
		setContent,
		getContent,
		getLinkItems,
		getCustomArticle,
		getRenderContent,
		getBrotherFileNames,
	},
	editOn: {
		source,
		app,
	},
	resource: {
		get,
		set,
		remove,
		getNames,
	},
	create,
	getProps,
	updateContent,
	checkLastModified,
};

export default article;
