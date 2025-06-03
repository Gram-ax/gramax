import { getExecutingEnvironment } from "@app/resolveModule/env";
import IsFirstLoadService from "@core-ui/ContextServices/IsFirstLoadService";
import useRemoveQueryT from "@core-ui/useRemoveQueryT";
import useShareHandler from "@ext/catalog/actions/share/logic/useShareHandler";
import useEnterpriseTokenHandler from "@ext/enterprise/utils/useEnterpriseTokenHandler";
import { useFindInvalidSouresOnStart } from "@ext/git/actions/Source/logic/useFindInvalidSources";
import { saveTempTokenIfPresent } from "@ext/git/actions/Source/tempToken";
import usePathnameCloneHandler from "@ext/git/core/GitPathnameHandler/clone/logic/usePathnameCloneHandler";
import usePathnameHandler from "@ext/git/core/GitPathnameHandler/usePathnameHandler";
import useInitCatalogToIndexOnFirstLoad from "@ext/git/migration/useInitCatalogToIndex";

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
		(saveTempTokenIfPresent(/\?access_token=/) ||
			(saveTempTokenIfPresent(/\?enterpriseToken=/) && typeof window.opener !== "undefined"))
	)
		window.close();
};

const useOnFirstLoadFuncs = () => {
	const isFirstLoad = IsFirstLoadService.value;

	closeIfChild();
	useFindInvalidSouresOnStart(isFirstLoad);
	useRemoveQueryT(isFirstLoad);
	useShareHandler(isFirstLoad);
	useEnterpriseTokenHandler(isFirstLoad);
	usePathnameCloneHandler();
	usePathnameHandler(isFirstLoad);
	useInitCatalogToIndexOnFirstLoad(isFirstLoad);
	// useReviewHandler(isFirstLoad);
};

export default useOnFirstLoadFuncs;
