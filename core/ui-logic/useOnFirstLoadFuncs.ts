import { getExecutingEnvironment } from "@app/resolveModule";
import IsFirstLoadService from "@core-ui/ContextServices/IsFirstLoadService";
import useRemoveQueryT from "@core-ui/useRemoveQueryT";
import useReviewHandler from "@ext/catalog/actions/review/logic/useReviewHandler";
import useShareHandler from "@ext/catalog/actions/share/logic/useShareHandler";
import useRemoveExpiredSources from "@ext/git/actions/Source/logic/useRemoveExpariedSources";
import usePathnameCheckoutHandler from "@ext/git/core/GitPathnameHandler/checkout/logic/usePathnameCheckoutHandler";
import usePathnameCloneHandler from "@ext/git/core/GitPathnameHandler/clone/logic/usePathnameCloneHandler";
import usePathnamePullHandler from "@ext/git/core/GitPathnameHandler/pull/logic/usePathnamePullHandler";

const closeIfChild = () => {
	if (typeof window === "undefined" || getExecutingEnvironment() == "next") return;
	if (!window?.opener?.onLoadApp) return;
	window.opener.onLoadApp(window.location);
	window.close();
};

const useOnFirstLoadFuncs = () => {
	const isFirstLoad = IsFirstLoadService.value;

	closeIfChild();
	useRemoveExpiredSources(isFirstLoad);
	useRemoveQueryT(isFirstLoad);
	useReviewHandler(isFirstLoad);
	useShareHandler(isFirstLoad);
	usePathnamePullHandler(isFirstLoad);
	usePathnameCloneHandler(isFirstLoad);
	usePathnameCheckoutHandler(isFirstLoad);
};

export default useOnFirstLoadFuncs;
