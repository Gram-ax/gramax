import { getExecutingEnvironment } from "@app/resolveModule/env";
import IsFirstLoadService from "@core-ui/ContextServices/IsFirstLoadService";
import useInitPlugins from "@core-ui/useInitPlugins";
import useRemoveQueryT from "@core-ui/useRemoveQueryT";
import useReviewHandler from "@ext/catalog/actions/review/logic/useReviewHandler";
import useShareHandler from "@ext/catalog/actions/share/logic/useShareHandler";
import { saveTempGithubTokenIfPresent } from "@ext/git/actions/Source/GitHub/logic/GithubTempToken";
import useRemoveExpiredSources from "@ext/git/actions/Source/logic/useRemoveExpariedSources";
import usePathnameCheckoutHandler from "@ext/git/core/GitPathnameHandler/checkout/logic/usePathnameCheckoutHandler";
import usePathnameCloneHandler from "@ext/git/core/GitPathnameHandler/clone/logic/usePathnameCloneHandler";
import usePathnamePullHandler from "@ext/git/core/GitPathnameHandler/pull/logic/usePathnamePullHandler";

const closeIfChild = () => {
	if (typeof window === "undefined" || getExecutingEnvironment() == "next") return;
	window.opener?.onLoadApp(window.location);
	if (window.opener || saveTempGithubTokenIfPresent()) window.close();
};

const useOnFirstLoadFuncs = () => {
	const isFirstLoad = IsFirstLoadService.value;

	closeIfChild();
	useInitPlugins(isFirstLoad);
	useRemoveExpiredSources(isFirstLoad);
	useRemoveQueryT(isFirstLoad);
	useReviewHandler(isFirstLoad);
	useShareHandler(isFirstLoad);
	usePathnamePullHandler(isFirstLoad);
	usePathnameCloneHandler(isFirstLoad);
	usePathnameCheckoutHandler(isFirstLoad);
};

export default useOnFirstLoadFuncs;
