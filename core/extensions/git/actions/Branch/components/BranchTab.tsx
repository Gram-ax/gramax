import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import Icon from "@components/Atoms/Icon";
import TabWrapper from "@components/Layouts/LeftNavigationTabs/TabWrapper";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import BranchActions from "@ext/git/actions/Branch/components/BranchActions";
import type GitBranchData from "@ext/git/core/GitBranch/model/GitBranchData";
import t from "@ext/localization/locale/translate";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { editCatalogPermission } from "@ext/security/logic/Permission/Permissions";
import { useCallback, useRef, useState } from "react";

interface BranchTabProps {
	show: boolean;
	branch: GitBranchData;
	setShow: (show: boolean) => void;
	onMergeRequestCreate?: () => void;
	onClose: () => void;
}

const BranchTab = ({ show, setShow, onClose, branch, onMergeRequestCreate }: BranchTabProps) => {
	const [contentHeight, setContentHeight] = useState<number>(null);
	const [isInitNewBranch, setIsInitNewBranch] = useState(false);
	const tabWrapperRef = useRef<HTMLDivElement>(null);

	const { isNext } = usePlatform();

	const apiUrlCreator = ApiUrlCreatorService.value;
	const branchName = branch?.name;

	const workspacePath = WorkspaceService.current().path;
	const catalogName = useCatalogPropsStore((state) => state.data?.name);
	const canEditCatalog = PermissionService.useCheckPermission(editCatalogPermission, workspacePath, catalogName);

	const allowAddNewBranch = !isNext && canEditCatalog;

	const onSwitchBranch = useCallback(
		async (isNewBranchCreated: boolean) => {
			if (isNewBranchCreated)
				await BranchUpdaterService.updateBranch(apiUrlCreator, OnBranchUpdateCaller.CheckoutToNewCreatedBranch);
			else {
				await BranchUpdaterService.updateBranch(apiUrlCreator);
				await ArticleUpdaterService.update(apiUrlCreator);
			}
		},
		[apiUrlCreator],
	);

	return (
		<TabWrapper
			contentHeight={contentHeight}
			onClose={onClose}
			ref={tabWrapperRef}
			show={show}
			title={t("branches")}
			titleRightExtension={
				allowAddNewBranch && (
					<Icon
						code="plus"
						isAction
						onClick={() => setIsInitNewBranch((prev) => !prev)}
						style={{ fontSize: "1.35em", marginLeft: "-0.5em" }}
						tooltipContent={t("add-new-branch")}
					/>
				)
			}
		>
			<div>
				<BranchActions
					allowAddNewBranch={allowAddNewBranch}
					currentBranch={branchName}
					isInitNewBranch={isInitNewBranch}
					onMergeRequestCreate={onMergeRequestCreate}
					onSwitchBranch={onSwitchBranch}
					setContentHeight={setContentHeight}
					setIsInitNewBranch={setIsInitNewBranch}
					setShow={setShow}
					show={show}
					tabWrapperRef={tabWrapperRef}
				/>
			</div>
		</TabWrapper>
	);
};

export default BranchTab;
