import create from "./create";
import getBrotherFileNames from "./getBrotherFileNames";
import getLogo from "./getLogo";
import remove from "./remove";
import getReviewLink from "./review/getReviewLink";
import getReviewLinkData from "./review/getReviewLinkData";
import getShareLink from "./share/getShareLink";
import getShareLinkData from "./share/getShareLinkData";
import updateNavigation from "./updateNavigation";
import updateProps from "./updateProps";

const catalog = {
	review: {
		getShareLink,
		getShareLinkData,
		getReviewLink,
		getReviewLinkData,
	},
	create,
	remove,
	getLogo,
	getBrotherFileNames,
	updateNavigation,
	updateProps,
};

export default catalog;
