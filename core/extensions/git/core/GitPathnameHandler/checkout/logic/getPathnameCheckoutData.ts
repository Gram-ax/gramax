import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import BranchData from "@ext/VersionControl/model/branch/BranchData";

const getPathnameCheckoutData = async (
	apiUrlCreator: ApiUrlCreator,
	routerPath: Path,
): Promise<{ haveToCheckout: true; currentBranch: string; branchToCheckout: string } | { haveToCheckout: false }> => {
	if (!RouterPathProvider.isEditorPathname(routerPath)) return { haveToCheckout: false };
	const { refname: branchToCheckout } = RouterPathProvider.parsePath(routerPath);
	if (!branchToCheckout) return { haveToCheckout: false };

	const res = await FetchService.fetch<BranchData>(apiUrlCreator.getVersionControlCurrentBranchUrl());
	if (!res.ok) return { haveToCheckout: false };

	const currentBranchName = (await res.json())?.name;
	if (!currentBranchName) return { haveToCheckout: false };

	if (branchToCheckout == currentBranchName) return { haveToCheckout: false };
	return { haveToCheckout: true, currentBranch: currentBranchName, branchToCheckout };
};

export default getPathnameCheckoutData;
