import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import BranchActions from "@ext/git/actions/Branch/components/BranchActions";
import type GitBranchData from "@ext/git/core/GitBranch/model/GitBranchData";
import t from "@ext/localization/locale/translate";
import SpinnerLoader from "../../../../../components/Atoms/SpinnerLoader";
import StatusBarElement from "../../../../../components/Layouts/StatusBar/StatusBarElement";
import ApiUrlCreatorService from "../../../../../ui-logic/ContextServices/ApiUrlCreator";
import useIsReview from "../../../../storage/logic/utils/useIsReview";
import BranchUpdaterService from "../BranchUpdaterService/logic/BranchUpdaterService";

const Branch = ({ branch, onMergeRequestCreate }: { branch: GitBranchData; onMergeRequestCreate?: () => void }) => {
	const isReview = useIsReview();
	const apiUrlCreator = ApiUrlCreatorService.value;

	const branchName = branch?.name;

	return (
		<div data-qa="qa-clickable" style={{ pointerEvents: isReview ? "none" : "all" }}>
			<BranchActions
				currentBranch={branchName}
				onMergeRequestCreate={onMergeRequestCreate}
				trigger={
					<StatusBarElement
						tooltipText={t("git.checkout.change-branch")}
						iconCode="git-branch"
						iconStrokeWidth="1.6"
					>
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
