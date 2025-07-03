import language from "@app/commands/catalog/language";
import logo from "@app/commands/catalog/logo";
import getViewRenderData from "@app/commands/catalog/properties/getViewRenderData";
import create from "./create";
import getBrotherFileNames from "./getBrotherFileNames";
import getAddedCounters from "./properties/getAddedCounters";
import remove from "./remove";
import getReviewLink from "./review/getReviewLink";
import getReviewLinkData from "./review/getReviewLinkData";
import getShareLink from "./share/getShareLink";
import getShareLinkData from "./share/getShareLinkData";
import getShareTicket from "./share/getShareTicket";
import upload from "./static/upload";
import updateNavigation from "./updateNavigation";
import updateProps from "./updateProps";
import setSyntax from "./setSyntax";
import getArticlesData from "./favorite/getArticlesData";
import links from "./links";

const catalog = {
	review: {
		getShareLink,
		getReviewLink,
		getShareTicket,
		getShareLinkData,
		getReviewLinkData,
	},
	logo,
	static: {
		upload,
	},
	favorite: {
		getArticlesData,
	},
	links,
	create,
	remove,
	getBrotherFileNames,
	getViewRenderData,
	getAddedCounters,
	updateNavigation,
	updateProps,
	language,
	setSyntax,
};

export default catalog;
