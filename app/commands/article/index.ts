import getRenderContentByLogicPath from "@app/commands/article/features/getRenderContentByLogicPath";
import getProperty from "@app/commands/article/property/get";
import removeProperty from "@app/commands/article/property/remove";
import update from "@app/commands/article/property/update";
import provider from "@app/commands/article/provider";
import createFromPath from "@app/commands/article/resource/createFromPath";
import getPath from "@app/commands/article/resource/getPath";
import create from "./create";
import app from "./editOn/app";
import source from "./editOn/source";
import checkLastModified from "./features/checkLastModified";
import getArticleHeadersByRelativePath from "./features/getArticleHeadersByRelativePath";
import getBrotherFileNames from "./features/getBrotherFileNames";
import getBrotherNames from "./features/getBrotherNames";
import getContent from "./features/getContent";
import getCustomArticle from "./features/getCustomArticle";
import getEditorContent from "./features/getEditorContent";
import getLinkItems from "./features/getLinkItems";
import getRenderContent from "./features/getRenderContent";
import setContent from "./features/setContent";
import getNameAfterMove from "./getNameAfterMove";
import getProps from "./getProps";
import markAsOpened from "./markAsOpened";
import markAsRead from "./markAsRead";
import move from "./move";
import get from "./resource/get";
import getByPath from "./resource/getByPath";
import removeResource from "./resource/remove";
import set from "./resource/set";
import updateContent from "./updateContent";

const article = {
	features: {
		setContent,
		getArticleHeadersByRelativePath,
		getContent,
		getLinkItems,
		getCustomArticle,
		getRenderContent,
		getEditorContent,
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
		getByPath,
		createFromPath,
		removeResource,
		getBrotherNames,
		getPath,
	},
	property: {
		getProperty,
		update,
		removeProperty,
	},
	move,
	getNameAfterMove,
	provider,
	create,
	getProps,
	updateContent,
	checkLastModified,
	markAsRead,
	markAsOpened,
};

export default article;
