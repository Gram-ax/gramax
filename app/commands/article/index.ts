import getLinkItemByPath from "@app/commands/article/features/getLinkItemByPath";
import getRenderContentByLogicPath from "@app/commands/article/features/getRenderContentByLogicPath";
import getProperty from "@app/commands/article/property/get";
import removeProperty from "@app/commands/article/property/remove";
import update from "@app/commands/article/property/update";
import provider from "@app/commands/article/provider";
import create from "./create";
import app from "./editOn/app";
import source from "./editOn/source";
import createLinkFromHref from "./features/createLinkFromHref";
import getArticleHeadersByRelativePath from "./features/getArticleHeadersByRelativePath";
import getBrotherFileNames from "./features/getBrotherFileNames";
import getBrotherNames from "./features/getBrotherNames";
import getContent from "./features/getContent";
import getCustomArticle from "./features/getCustomArticle";
import getEditorContent from "./features/getEditorContent";
import getLinkItems from "./features/getLinkItems";
import getRenderContent from "./features/getRenderContent";
import getTakenAliases from "./features/getTakenAliases";
import setContent from "./features/setContent";
import getNameAfterMove from "./getNameAfterMove";
import getProps from "./getProps";
import move from "./move";
import resource from "./resource";

import updateContent from "./updateContent";

const article = {
	features: {
		setContent,
		getArticleHeadersByRelativePath,
		getContent,
		getLinkItems,
		getLinkItemByPath,
		getCustomArticle,
		getRenderContent,
		getEditorContent,
		getBrotherFileNames,
		getTakenAliases,
		getRenderContentByLogicPath,
		createLinkFromHref,
		getBrotherNames,
	},
	editOn: {
		source,
		app,
	},
	resource,
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
};

export default article;
