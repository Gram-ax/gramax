import { getExecutingEnvironment } from "@app/resolveModule/env";
import IsFirstLoadService from "@core-ui/ContextServices/IsFirstLoadService";
import useRemoveQueryT from "@core-ui/useRemoveQueryT";
import useShareHandler from "@ext/catalog/actions/share/logic/useShareHandler";
import useEnterpriseTokenHandler from "@ext/enterprise/useEnterpriseTokenHandler";
import useRemoveExpiredSources from "@ext/git/actions/Source/logic/useRemoveExpariedSources";
import { saveTempTokenIfPresent } from "@ext/git/actions/Source/tempToken";
import usePathnameCloneHandler from "@ext/git/core/GitPathnameHandler/clone/logic/usePathnameCloneHandler";
import usePathnameHandler from "@ext/git/core/GitPathnameHandler/usePathnameHandler";

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
	useRemoveExpiredSources(isFirstLoad);
	useRemoveQueryT(isFirstLoad);
	useShareHandler(isFirstLoad);
	useEnterpriseTokenHandler(isFirstLoad);
	usePathnameCloneHandler(isFirstLoad);
	usePathnameHandler(isFirstLoad);
	// useReviewHandler(isFirstLoad);
};

export default useOnFirstLoadFuncs;
