import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import BranchData from "@ext/VersionControl/model/branch/BranchData";

const getPathnameCheckoutData = async (
	apiUrlCreator: ApiUrlCreator,
	branchToCheckout: string,
): Promise<{ haveToCheckout: true; currentBranch: string; branchToCheckout: string } | { haveToCheckout: false }> => {
	if (!branchToCheckout) return { haveToCheckout: false };

	const res = await FetchService.fetch<BranchData>(apiUrlCreator.getCurrentBranch());
	if (!res.ok) return { haveToCheckout: false };

	const currentBranchName = (await res.json())?.name;
	if (!currentBranchName) return { haveToCheckout: false };

	if (branchToCheckout == currentBranchName) return { haveToCheckout: false };
	return { haveToCheckout: true, currentBranch: currentBranchName, branchToCheckout };
};

export default getPathnameCheckoutData;
