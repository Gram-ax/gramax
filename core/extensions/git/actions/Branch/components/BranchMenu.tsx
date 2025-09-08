import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import Icon from "@components/Atoms/Icon";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import MergeModal from "@ext/git/actions/Branch/components/MergeModal";
import CreateMergeRequestModal from "@ext/git/actions/Branch/components/MergeRequest/CreateMergeRequest";
import tryOpenMergeConflict from "@ext/git/actions/MergeConflictHandler/logic/tryOpenMergeConflict";
import MergeData from "@ext/git/actions/MergeConflictHandler/model/MergeData";
import { CreateMergeRequest } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import DeleteItem from "@ext/item/actions/DeleteItem";
import t from "@ext/localization/locale/translate";
import { ComponentProps, useCallback, useState } from "react";

interface BranchMenuProps {
	currentBranchName: string;
	branchName: string;
	refreshList?: () => void;
	onMergeRequestCreate?: () => void;
}

const BranchMenu = (props: BranchMenuProps) => {
	const { currentBranchName, branchName, refreshList, onMergeRequestCreate } = props;

	const [isLoading, setIsLoading] = useState(false);

	const apiUrlCreator = ApiUrlCreatorService.value;
	const gesUrl = PageDataContextService.value.conf.enterprise.gesUrl;
	const isEnterprise = !!gesUrl;

	const onClickParent = (e) => {
		e.stopPropagation();
		e.preventDefault();
	};

	const setCreateMergeRequestModal = useCallback(
		(e) => {
			onClickParent(e);
			ModalToOpenService.setValue<ComponentProps<typeof CreateMergeRequestModal>>(
				ModalToOpen.CreateMergeRequest,
				{
					preventSearchAndStartLoading: isEnterprise,
					useGesUsersSelect: isEnterprise,
					sourceBranchRef: currentBranchName,
					targetBranchRef: branchName,
					onOpen: async () => {
						if (!isEnterprise) return;
						const result = await new EnterpriseApi(gesUrl).isEnabledGetUsers();
						ModalToOpenService.updateArgs<ComponentProps<typeof CreateMergeRequestModal>>((prevArgs) => ({
							...prevArgs,
							useGesUsersSelect: result,
							preventSearchAndStartLoading: false,
						}));
					},
					onSubmit: async (mergeRequest: CreateMergeRequest) => {
						ModalToOpenService.updateArgs<ComponentProps<typeof CreateMergeRequestModal>>((prevArgs) => ({
							...prevArgs,
							isLoading: true,
						}));
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
		},
		[currentBranchName, branchName, isEnterprise, gesUrl, onMergeRequestCreate, refreshList],
	);

	const instantMerge = useCallback(
		(e) => {
			onClickParent(e);
			ModalToOpenService.setValue<ComponentProps<typeof MergeModal>>(ModalToOpen.Merge, {
				sourceBranchRef: currentBranchName,
				targetBranchRef: branchName,
				onSubmit: async (mergeRequestOptions) => {
					ModalToOpenService.updateArgs((prevArgs) => ({ ...prevArgs, isLoading: true }));
					const res = await FetchService.fetch<MergeData>(
						apiUrlCreator.mergeInto(
							branchName,
							mergeRequestOptions?.deleteAfterMerge,
							mergeRequestOptions?.squash,
						),
					);
					ModalToOpenService.resetValue();
					await BranchUpdaterService.updateBranch(apiUrlCreator);
					await ArticleUpdaterService.update(apiUrlCreator);
					if (!res.ok) return;
					tryOpenMergeConflict({ mergeData: await res.json() });
					refreshList?.();
				},
				onClose: () => {
					ModalToOpenService.resetValue();
				},
			});
		},
		[currentBranchName, branchName, refreshList],
	);

	const deleteBranch = useCallback(async () => {
		if (isLoading) return;

		try {
			refreshList?.();
			setIsLoading(true);
			await FetchService.fetch(apiUrlCreator.getVersionControlDeleteBranchUrl(branchName));
		} finally {
			setIsLoading(false);
		}
	}, [branchName, refreshList, apiUrlCreator]);

	return (
		<div style={{ marginRight: "-8px" }}>
			<PopupMenuLayout
				appendTo={() => document.body}
				trigger={
					<Icon isAction onClick={onClickParent} code="ellipsis-vertical" tooltipContent={t("actions")} />
				}
			>
				<ButtonLink iconCode="merge" text={t("git.merge.instant-merge")} onClick={instantMerge} />
				<ButtonLink
					iconCode="git-pull-request-arrow"
					text={t("git.merge-requests.create")}
					onClick={setCreateMergeRequestModal}
				/>
				<DeleteItem
					buttonText={t("delete")}
					confirmTitle={t("git.branch.delete.confirm.title")}
					confirmBody={
						<span
							className="article"
							dangerouslySetInnerHTML={{
								__html: t("git.branch.delete.confirm.description").replace("{{branch}}", branchName),
							}}
						/>
					}
					onConfirm={deleteBranch}
					isLoading={isLoading}
				/>
			</PopupMenuLayout>
		</div>
	);
};

export default BranchMenu;
