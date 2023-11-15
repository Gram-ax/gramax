import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import { refreshPage } from "@core-ui/ContextServices/RefreshPageContext";
import BranchActions from "@ext/git/actions/Branch/components/BranchActions";
import { useEffect, useState } from "react";
import SpinnerLoader from "../../../../../components/Atoms/SpinnerLoader";
import StatusBarElement from "../../../../../components/Layouts/StatusBar/StatusBarElement";
import { useRouter } from "../../../../../logic/Api/useRouter";
import ApiUrlCreatorService from "../../../../../ui-logic/ContextServices/ApiUrlCreator";
import CatalogPropsService from "../../../../../ui-logic/ContextServices/CatalogProps";
import useLocalize from "../../../../localization/useLocalize";
import useIsReview from "../../../../storage/logic/utils/useIsReview";
import BranchUpdaterService from "../logic/BranchUpdaterService";

const Branch = () => {
	const router = useRouter();
	const catalogProps = CatalogPropsService.value;
	const isReview = useIsReview();
	const apiUrlCreator = ApiUrlCreatorService.value;

	const [branchName, setBranchName] = useState<string>("");

	const onUpdateBranch = (branch: string) => {
		setBranchName(branch);
		refreshPage();
	};

	useEffect(() => {
		BranchUpdaterService.bindOnUpdateBranch(onUpdateBranch);
		BranchUpdaterService.updateBranch(apiUrlCreator);
	}, []);

	return (
		<div style={{ pointerEvents: isReview ? "none" : "all" }}>
			<BranchActions
				currentBranch={branchName}
				trigger={
					<StatusBarElement tooltipText={useLocalize("changeBranch")} iconCode="code-branch">
						<span>{branchName ? branchName : <SpinnerLoader width={11} height={11} />}</span>
					</StatusBarElement>
				}
				onNewBranch={async () => {
					router.pushPath(catalogProps.name);
					await BranchUpdaterService.updateBranch(apiUrlCreator);
					await ArticleUpdaterService.update(apiUrlCreator);
				}}
				onStopMerge={async (isError) => {
					if (isError) return;
					await BranchUpdaterService.updateBranch(apiUrlCreator);
					await ArticleUpdaterService.update(apiUrlCreator);
				}}
			/>
		</div>
	);
};

export default Branch;
