import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import styled from "@emotion/styled";
import MergeModal from "@ext/git/actions/Branch/components/MergeModal";
import CreateMergeRequestModal from "@ext/git/actions/Branch/components/MergeRequest/CreateMergeRequest";
import tryOpenMergeConflict from "@ext/git/actions/MergeConflictHandler/logic/tryOpenMergeConflict";
import MergeData from "@ext/git/actions/MergeConflictHandler/model/MergeData";
import { CreateMergeRequest } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import t from "@ext/localization/locale/translate";
import { ComponentProps } from "react";

interface BranchMenuProps {
	currentBranchName: string;
	branchName: string;
	closeList: () => void;
	onMergeRequestCreate?: () => void;
	className?: string;
}

const BranchMenu = ({ currentBranchName, branchName, closeList, className, onMergeRequestCreate }: BranchMenuProps) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const isEnterprise = !!PageDataContextService.value.conf.enterprise.gesUrl;

	return (
		<div
			className={className}
			onClick={(e) => {
				e.stopPropagation();
				e.preventDefault();
			}}
		>
			<PopupMenuLayout openTrigger="click" isInline offset={[0, 10]} tooltipText={t("actions")}>
				<div
					onClick={() => {
						closeList();
						ModalToOpenService.setValue<ComponentProps<typeof MergeModal>>(ModalToOpen.Merge, {
							sourceBranchRef: currentBranchName,
							targetBranchRef: branchName,
							onSubmit: async (mergeRequestOptions) => {
								ModalToOpenService.setValue(ModalToOpen.Loading);
								const res = await FetchService.fetch<MergeData>(
									apiUrlCreator.mergeInto(branchName, mergeRequestOptions?.deleteAfterMerge),
								);
								ModalToOpenService.resetValue();
								if (!res.ok) return;
								tryOpenMergeConflict({ mergeData: await res.json() });
							},
							onClose: () => {
								ModalToOpenService.resetValue();
							},
						});
					}}
				>
					{t("git.merge.instant-merge")}
				</div>
				<div
					onClick={() => {
						closeList();
						ModalToOpenService.setValue<ComponentProps<typeof CreateMergeRequestModal>>(
							ModalToOpen.CreateMergeRequest,
							{
								isEnterprise,
								sourceBranchRef: currentBranchName,
								targetBranchRef: branchName,
								onSubmit: async (mergeRequest: CreateMergeRequest) => {
									ModalToOpenService.setValue(ModalToOpen.Loading);
									const res = await FetchService.fetch(
										apiUrlCreator.createMergeRequest(),
										JSON.stringify(mergeRequest),
									);
									ModalToOpenService.resetValue();
									if (res.ok) onMergeRequestCreate?.();
								},
								onClose: () => {
									ModalToOpenService.resetValue();
								},
							},
						);
					}}
				>
					{t("git.merge-requests.create")}
				</div>
			</PopupMenuLayout>
		</div>
	);
};

export default styled(BranchMenu)`
	display: inline-flex;
	align-items: center;
	justify-content: center;
`;
