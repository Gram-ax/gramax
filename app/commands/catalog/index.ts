import language from "@app/commands/catalog/language";
import create from "./create";
import getBrotherFileNames from "./getBrotherFileNames";
import getLogo from "./getLogo";
import remove from "./remove";
import getReviewLink from "./review/getReviewLink";
import getReviewLinkData from "./review/getReviewLinkData";
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
	create,
	remove,
	getLogo,
	getBrotherFileNames,
	updateNavigation,
	updateProps,
	language,
};

export default catalog;
