import language from "@app/commands/catalog/language";
import logo from "@app/commands/catalog/logo";
import getViewRenderData from "@app/commands/catalog/properties/getViewRenderData";
import getUploadStatus from "./cloud/getUploadStatus";
import upload from "./cloud/upload";
import create from "./create";
import getArticlesData from "./favorite/getArticlesData";
import getBrotherFileNames from "./getBrotherFileNames";
import getNameAfterMove from "./getNameAfterMove";
import getProps from "./getProps";
import links from "./links";
import move from "./move";
import remove from "./remove";
import setSyntax from "./setSyntax";
import getShareLink from "./share/getShareLink";
import getShareLinkData from "./share/getShareLinkData";
import getShareTicket from "./share/getShareTicket";
import updateNavigation from "./updateNavigation";
import updateProps from "./updateProps";
import views from "./views";

const catalog = {
	review: {
		getShareLink,
		getShareTicket,
		getShareLinkData,
	},
	logo,
	cloud: {
		upload,
		getUploadStatus,
	},
	favorite: {
		getArticlesData,
	},
	views,
	links,
	create,
	remove,
	getBrotherFileNames,
	getViewRenderData,
	updateNavigation,
	getNameAfterMove,
	move,
	updateProps,
	language,
	setSyntax,
	getProps,
};

export default catalog;
