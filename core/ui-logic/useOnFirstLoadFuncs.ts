import { getExecutingEnvironment } from "@app/resolveModule/env";
import IsFirstLoadService from "@core-ui/ContextServices/IsFirstLoadService";
import useRemoveQueryT from "@core-ui/useRemoveQueryT";
import useShareHandler from "@ext/catalog/actions/share/logic/useShareHandler";
import useEnterpriseTokenHandler from "@ext/enterprise/utils/useEnterpriseTokenHandler";
import { saveTempTokenIfPresent } from "@ext/git/actions/Source/tempToken";
import usePathnameCloneHandler from "@ext/git/core/GitPathnameHandler/clone/logic/usePathnameCloneHandler";
import usePathnameHandler from "@ext/git/core/GitPathnameHandler/usePathnameHandler";

const closeIfChild = () => {
	if (typeof window === "undefined") return;

	if (window.opener && getExecutingEnvironment() === "browser") {
		window?.opener?.onLoadApp?.(window.location);
	}

	if (
		getExecutingEnvironment() !== "tauri" &&
		(saveTempTokenIfPresent(/\?access_token=/) || (saveTempTokenIfPresent(/\?enterpriseToken=/) && window.opener))
	) {
		window.close();
	}
};

const useOnFirstLoadFuncs = () => {
	const isFirstLoad = IsFirstLoadService.value;

	closeIfChild();
	useRemoveQueryT(isFirstLoad);
	useShareHandler(isFirstLoad);
	useEnterpriseTokenHandler(isFirstLoad);
	usePathnameCloneHandler();
	usePathnameHandler(isFirstLoad);
	// useReviewHandler(isFirstLoad);
};

export default useOnFirstLoadFuncs;
