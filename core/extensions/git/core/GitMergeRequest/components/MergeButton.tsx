import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import Button, { TextSize } from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import styled from "@emotion/styled";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import { MergeRequestStatus } from "@ext/git/core/GitMergeRequest/components/Elements/Status";
import { MergeRequestConfirmProps } from "@ext/git/core/GitMergeRequest/components/MergeRequestConfirm";
import { MergeRequest } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import t from "@ext/localization/locale/translate";
import { useCallback } from "react";

export type MergeButtonProps = {
	mergeRequest: MergeRequest;
	status: MergeRequestStatus;
	hasConflicts: boolean;
};

const useIsMergeAvailable = ({ mergeRequest, status, hasConflicts }: MergeButtonProps) => {
	const pageProps = PageDataContextService.value;

	if (status === "draft") return { disabled: true, reason: t("git.merge-requests.disable-button-reason.draft") };
	if (status === "in-progress")
		return { disabled: true, reason: t("git.merge-requests.disable-button-reason.not-approved") };
	if (status === "approved" && hasConflicts)
		return { disabled: true, reason: t("git.merge-requests.disable-button-reason.has-conflicts") };

	if (mergeRequest.creator.email != pageProps.userInfo?.mail)
		return { disabled: true, reason: t("git.merge-requests.disable-button-reason.not-author") };

	return { disabled: false, reason: null };
};

const MergeButtonWrapper = styled.div`
	i > svg {
		fill: var(--color-text-accent);
	}

	&:hover {
		i > svg {
			fill: white;
		}
	}
`;

const MergeButton = ({ mergeRequest, status }: MergeButtonProps) => {
	const apiUrlCreator = ApiUrlCreatorService.value;

	const { disabled, reason } = useIsMergeAvailable({ mergeRequest, status, hasConflicts: false });

	const startMerge = useCallback(async () => {
		const validateMergeUrl = apiUrlCreator.validateMerge();
		ModalToOpenService.setValue(ModalToOpen.Loading);
		const res = await FetchService.fetch(validateMergeUrl);
		ModalToOpenService.resetValue();
		if (!res.ok) return;

		const mergeUrl = apiUrlCreator.mergeRequestMerge(
			mergeRequest.targetBranchRef,
			mergeRequest.options?.deleteAfterMerge,
			false,
		);
		ModalToOpenService.setValue<MergeRequestConfirmProps>(ModalToOpen.MergeRequestConfirm, {
			sourceBranch: mergeRequest.sourceBranchRef,
			targetBranch: mergeRequest.targetBranchRef,
			deleteAfterMerge: mergeRequest.options?.deleteAfterMerge,
			onMergeClick: async () => {
				ModalToOpenService.setValue(ModalToOpen.Loading);
				await FetchService.fetch(mergeUrl);
				ModalToOpenService.resetValue();

				await BranchUpdaterService.updateBranch(apiUrlCreator);
				await ArticleUpdaterService.update(apiUrlCreator);
			},
		});
	}, [apiUrlCreator, mergeRequest]);

	const button = (
		<MergeButtonWrapper>
			<Button
				isEmUnits
				textSize={TextSize.M}
				style={{ maxHeight: "29px" }}
				disabled={disabled}
				buttonStyle={ButtonStyle.orange}
				onClick={startMerge}
			>
				<Icon code="git-merge2" />
				<span>{t("git.merge.branches")}</span>
			</Button>
		</MergeButtonWrapper>
	);

	return disabled ? <Tooltip content={reason}>{button}</Tooltip> : button;
};

export default MergeButton;
