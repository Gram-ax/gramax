import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import Icon from "@components/Atoms/Icon";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import Workspace from "@core-ui/ContextServices/Workspace";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import type MergeModal from "@ext/git/actions/Branch/components/MergeModal";
import type CreateMergeRequestModal from "@ext/git/actions/Branch/components/MergeRequest/CreateMergeRequest";
import tryOpenMergeConflict from "@ext/git/actions/MergeConflictHandler/logic/tryOpenMergeConflict";
import type MergeData from "@ext/git/actions/MergeConflictHandler/model/MergeData";
import { useMergeRequestStore } from "@ext/git/core/GitMergeRequest/logic/store/MergeRequestStore";
import type { CreateMergeRequest } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import DeleteItem from "@ext/item/actions/DeleteItem";
import t from "@ext/localization/locale/translate";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@ui-kit/Dropdown";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { type ComponentProps, useCallback, useState } from "react";

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
	const workspace = Workspace.current();
	const gesUrl = workspace?.enterprise?.gesUrl;
	const isEnterprise = !!gesUrl;
	const hasMergeRequest = useMergeRequestStore((state) => !!state.mergeRequest && !state.isDraft);

	const setCreateMergeRequestModal = useCallback(() => {
		ModalToOpenService.setValue<ComponentProps<typeof CreateMergeRequestModal>>(ModalToOpen.CreateMergeRequest, {
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
				const res = await FetchService.fetch(apiUrlCreator.createMergeRequest(), JSON.stringify(mergeRequest));
				ModalToOpenService.resetValue();
				if (res.ok) onMergeRequestCreate?.();
			},
			onClose: () => {
				ModalToOpenService.resetValue();
			},
		});
	}, [currentBranchName, branchName, isEnterprise, gesUrl, onMergeRequestCreate, apiUrlCreator]);

	const instantMerge = useCallback(() => {
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
	}, [currentBranchName, branchName, refreshList, apiUrlCreator]);

	const deleteBranch = useCallback(async () => {
		if (isLoading) return;

		try {
			refreshList?.();
			setIsLoading(true);
			await FetchService.fetch(apiUrlCreator.getVersionControlDeleteBranchUrl(branchName));
		} finally {
			setIsLoading(false);
		}
	}, [branchName, refreshList, apiUrlCreator, isLoading]);

	return (
		<div className="right-extensions" style={{ marginRight: "-8px" }}>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Icon code="ellipsis-vertical" isAction tooltipContent={t("actions")} />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start">
					<Tooltip>
						<TooltipContent>{t("git.merge.error.merge-request-instant-merge")}</TooltipContent>
						<TooltipTrigger className="cursor-default block w-full">
							<DropdownMenuItem disabled={hasMergeRequest} onSelect={instantMerge}>
								<Icon code="merge" />
								{t("git.merge.instant-merge")}
							</DropdownMenuItem>
						</TooltipTrigger>
					</Tooltip>
					<Tooltip>
						<TooltipContent>{t("git.merge.error.merge-request-exists")}</TooltipContent>
						<TooltipTrigger className="cursor-default block w-full">
							<DropdownMenuItem disabled={hasMergeRequest} onSelect={setCreateMergeRequestModal}>
								<Icon code="git-pull-request-arrow" />
								{t("git.merge-requests.create")}
							</DropdownMenuItem>
						</TooltipTrigger>
					</Tooltip>
					<DeleteItem
						confirmBody={
							<span
								className="article"
								dangerouslySetInnerHTML={{
									__html: t("git.branch.delete.confirm.description").replace(
										"{{branch}}",
										branchName,
									),
								}}
							/>
						}
						confirmTitle={t("git.branch.delete.confirm.title")}
						isLoading={isLoading}
						onConfirm={deleteBranch}
					/>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};

export default BranchMenu;
