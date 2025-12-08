import language from "@app/commands/catalog/language";
import logo from "@app/commands/catalog/logo";
import getViewRenderData from "@app/commands/catalog/properties/getViewRenderData";
import getUploadStatus from "./cloud/getUploadStatus";
import upload from "./cloud/upload";
import create from "./create";
import getArticlesData from "./favorite/getArticlesData";
import getBrotherFileNames from "./getBrotherFileNames";
import getNameAfterMove from "./getNameAfterMove";
import links from "./links";
import move from "./move";
import remove from "./remove";
import getReviewLink from "./review/getReviewLink";
import getReviewLinkData from "./review/getReviewLinkData";
import setSyntax from "./setSyntax";
import getShareLink from "./share/getShareLink";
import getShareLinkData from "./share/getShareLinkData";
import getShareTicket from "./share/getShareTicket";
import updateNavigation from "./updateNavigation";
import updateProps from "./updateProps";

const catalog = {
	review: {
		getShareLink,
		getReviewLink,
		getShareTicket,
		getShareLinkData,
		getReviewLinkData,
	},
	logo,
	cloud: {
		upload,
		getUploadStatus,
	},
	favorite: {
		getArticlesData,
	},
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
};

export default catalog;
