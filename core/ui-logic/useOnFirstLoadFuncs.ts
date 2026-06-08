import { getExecutingEnvironment } from "@app/resolveModule/env";
import IsFirstLoadService from "@core-ui/ContextServices/IsFirstLoadService";
import useRemoveQueryT from "@core-ui/useRemoveQueryT";
import { useSyncViewQueryParam } from "@ext/catalog/views/logic/hooks/useSyncViewQueryParam";
import useEnterpriseTokenHandler from "@ext/enterprise/utils/useEnterpriseTokenHandler";
import useSwitchToEnterpriseWorkspace from "@ext/enterprise/utils/useSwitchToEnterpriseWorkspace";
import useInviteMismatchHandler from "@ext/enterprise-cloud/utils/useInviteMismatchHandler";
import { saveTempTokenIfPresent } from "@ext/git/actions/Source/tempToken";
import usePathnameCloneHandler from "@ext/git/core/GitPathnameHandler/clone/logic/usePathnameCloneHandler";
import usePathnameHandler from "@ext/git/core/GitPathnameHandler/usePathnameHandler";
import usePrintHandler from "@ext/print/usePrintHandler";

const closeIfChild = () => {
	if (typeof window === "undefined") return;

	if (window.opener && getExecutingEnvironment() === "browser") {
		window?.opener?.onLoadApp?.(window.location);
	}

	if (
		getExecutingEnvironment() !== "tauri" &&
		(saveTempTokenIfPresent(/\?access_token=/) || (saveTempTokenIfPresent(/\?oneTimeCode=/) && window.opener))
	) {
		window.close();
	}
};

const useOnFirstLoadFuncs = () => {
	const isFirstLoad = IsFirstLoadService.value;

	useSyncViewQueryParam();
	closeIfChild();
	useRemoveQueryT(isFirstLoad);
	useInviteMismatchHandler(isFirstLoad);
	useEnterpriseTokenHandler(isFirstLoad);
	usePathnameCloneHandler();
	usePathnameHandler(isFirstLoad);
	useSwitchToEnterpriseWorkspace(isFirstLoad);
	usePrintHandler(isFirstLoad);
	// useReviewHandler(isFirstLoad);
};

export default useOnFirstLoadFuncs;
