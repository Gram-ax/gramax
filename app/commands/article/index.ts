import getRenderContentByLogicPath from "@app/commands/article/features/getRenderContentByLogicPath";
import createFromPath from "@app/commands/article/resource/createFromPath";
import create from "./create";
import app from "./editOn/app";
import source from "./editOn/source";
import checkLastModified from "./features/checkLastModified";
import getArticleHeadersByRelativePath from "./features/getArticleHeadersByRelativePath";
import getBrotherFileNames from "./features/getBrotherFileNames";
import getBrotherNames from "./features/getBrotherNames";
import getContent from "./features/getContent";
import getCustomArticle from "./features/getCustomArticle";
import getLinkItems from "./features/getLinkItems";
import getRenderContent from "./features/getRenderContent";
import setContent from "./features/setContent";
import getProps from "./getProps";
import get from "./resource/get";
import removeResource from "./resource/remove";
import set from "./resource/set";
import updateContent from "./updateContent";
import update from "@app/commands/article/property/update";
import removeProperty from "@app/commands/article/property/remove";

const article = {
	features: {
		setContent,
		getArticleHeadersByRelativePath,
		getContent,
		getLinkItems,
		getCustomArticle,
		getRenderContent,
		getBrotherFileNames,
		getRenderContentByLogicPath,
	},
	editOn: {
		source,
		app,
	},
	resource: {
		get,
		set,
		createFromPath,
		removeResource,
		getBrotherNames,
	},
	property: {
		update,
		removeProperty,
	},
	create,
	getProps,
	updateContent,
	checkLastModified,
};

export default article;
