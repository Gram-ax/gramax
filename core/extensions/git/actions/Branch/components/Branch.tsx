import { getExecutingEnvironment } from "@app/resolveModule/env";
import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import { refreshPage } from "@core-ui/ContextServices/RefreshPageContext";
import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import BranchActions from "@ext/git/actions/Branch/components/BranchActions";
import t from "@ext/localization/locale/translate";
import { useEffect, useState } from "react";
import SpinnerLoader from "../../../../../components/Atoms/SpinnerLoader";
import StatusBarElement from "../../../../../components/Layouts/StatusBar/StatusBarElement";
import ApiUrlCreatorService from "../../../../../ui-logic/ContextServices/ApiUrlCreator";
import useIsReview from "../../../../storage/logic/utils/useIsReview";
import BranchUpdaterService from "../BranchUpdaterService/logic/BranchUpdaterService";

const Branch = () => {
	const isReview = useIsReview();
	const apiUrlCreator = ApiUrlCreatorService.value;

	const [branchName, setBranchName] = useState<string>(null);

	useEffect(() => {
		const onUpdateBranch = (branch: string) => {
			setBranchName(branch);
			if (getExecutingEnvironment() !== "next") refreshPage();
		};

		BranchUpdaterService.addListener(onUpdateBranch);
		BranchUpdaterService.updateBranch(apiUrlCreator, OnBranchUpdateCaller.Init);

		return () => BranchUpdaterService.removeListener(onUpdateBranch);
	}, []);

	return (
		<div data-qa="qa-clickable" style={{ pointerEvents: isReview ? "none" : "all" }}>
			<BranchActions
				currentBranch={branchName}
				trigger={
					<StatusBarElement tooltipText={t("change-branch")} iconCode="git-branch" iconStrokeWidth="1.6">
						<span>{branchName ? branchName : <SpinnerLoader width={12} height={12} />}</span>
					</StatusBarElement>
				}
				onNewBranch={async () => {
					await BranchUpdaterService.updateBranch(apiUrlCreator);
					await ArticleUpdaterService.update(apiUrlCreator);
				}}
				onStopMerge={async (haveConflicts) => {
					if (haveConflicts) return;
					await BranchUpdaterService.updateBranch(apiUrlCreator);
					await ArticleUpdaterService.update(apiUrlCreator);
				}}
			/>
		</div>
	);
};

export default Branch;
