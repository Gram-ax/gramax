import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import Button from "@components/Atoms/Button/Button";
import Tooltip from "@components/Atoms/Tooltip";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import { MergeRequestConfirmProps } from "@ext/git/core/GitMergeRequest/components/MergeRequestConfirm";
import { MergeRequestStatus } from "@ext/git/core/GitMergeRequest/components/Status";
import { MergeRequest } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import t from "@ext/localization/locale/translate";

interface MergeButtonProps {
	mergeRequest: MergeRequest;
	status: MergeRequestStatus;
}

const MergeButton = ({ mergeRequest, status }: MergeButtonProps) => {
	const hasConflicts = false;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const pageProps = PageDataContextService.value;

	const { disabled, reason } = ((): { disabled: boolean; reason?: string } => {
		if (status === "draft") return { disabled: true, reason: t("git.merge-requests.disable-button-reason.draft") };
		if (status === "in-progress")
			return { disabled: true, reason: t("git.merge-requests.disable-button-reason.not-approved") };
		if (status === "approved" && hasConflicts)
			return { disabled: true, reason: t("git.merge-requests.disable-button-reason.has-conflicts") };

		console.log(mergeRequest.author.email, pageProps.userInfo?.mail);
		if (mergeRequest.author.email != pageProps.userInfo?.mail)
			return { disabled: true, reason: t("git.merge-requests.disable-button-reason.not-author") };

		return { disabled: false };
	})();

	const onClick = () => {
		const url = apiUrlCreator.mergeRequestMerge(mergeRequest.targetBranchRef, mergeRequest.options?.deleteAfterMerge);
		ModalToOpenService.setValue<MergeRequestConfirmProps>(ModalToOpen.MergeRequestConfirm, {
			sourceBranch: mergeRequest.sourceBranchRef,
			targetBranch: mergeRequest.targetBranchRef,
			deleteAfterMerge: mergeRequest.options?.deleteAfterMerge,
			onMergeClick: async () => {
				ModalToOpenService.setValue(ModalToOpen.Loading);
				await FetchService.fetch(url);
				ModalToOpenService.resetValue();

				await BranchUpdaterService.updateBranch(apiUrlCreator);
				await ArticleUpdaterService.update(apiUrlCreator);
			},
		});
	};

	const button = (
		<div>
			<Button disabled={disabled} onClick={onClick}>
				{t("git.merge.merge")}
			</Button>
		</div>
	);

	return (
		<div style={{ display: "flex", justifyContent: "flex-end" }}>
			{disabled ? <Tooltip content={reason}>{button}</Tooltip> : button}
		</div>
	);
};

export default MergeButton;
