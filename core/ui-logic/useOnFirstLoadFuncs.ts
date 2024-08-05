import { getExecutingEnvironment } from "@app/resolveModule/env";
import IsFirstLoadService from "@core-ui/ContextServices/IsFirstLoadService";
import useInitPlugins from "@core-ui/useInitPlugins";
import useRemoveQueryT from "@core-ui/useRemoveQueryT";
import useReviewHandler from "@ext/catalog/actions/review/logic/useReviewHandler";
import useShareHandler from "@ext/catalog/actions/share/logic/useShareHandler";
import useRemoveExpiredSources from "@ext/git/actions/Source/logic/useRemoveExpariedSources";
import { saveTempTokenIfPresent } from "@ext/git/actions/Source/tempToken";
import usePathnameCheckoutHandler from "@ext/git/core/GitPathnameHandler/checkout/logic/usePathnameCheckoutHandler";
import usePathnameCloneHandler from "@ext/git/core/GitPathnameHandler/clone/logic/usePathnameCloneHandler";
import usePathnamePullHandler from "@ext/git/core/GitPathnameHandler/pull/logic/usePathnamePullHandler";
import useSsoHandler from "@ext/sso/useSsoHandler";
import useUserSettingsHandler from "@ext/sso/useUserSettingsHandler";

const closeIfChild = () => {
	if (
		typeof window !== "undefined" &&
		typeof window.opener !== "undefined" &&
		getExecutingEnvironment() === "browser"
	) {
		window?.opener?.onLoadApp?.(window.location);
	}

	if (
		typeof window !== "undefined" &&
		getExecutingEnvironment() !== "tauri" &&
		saveTempTokenIfPresent(/\?access_token=/)
	)
		window.close();
};

const useOnFirstLoadFuncs = () => {
	const isFirstLoad = IsFirstLoadService.value;

	closeIfChild();
	useInitPlugins(isFirstLoad);
	useRemoveExpiredSources(isFirstLoad);
	useRemoveQueryT(isFirstLoad);
	useReviewHandler(isFirstLoad);
	useShareHandler(isFirstLoad);
	useSsoHandler(isFirstLoad);
	useUserSettingsHandler(isFirstLoad);
	usePathnamePullHandler(isFirstLoad);
	usePathnameCloneHandler(isFirstLoad);
	usePathnameCheckoutHandler(isFirstLoad);
};

export default useOnFirstLoadFuncs;
