import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import Icon from "@components/Atoms/Icon";
import TabWrapper from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/TabWrapper";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import BranchActions from "@ext/git/actions/Branch/components/BranchActions";
import GitBranchData from "@ext/git/core/GitBranch/model/GitBranchData";
import t from "@ext/localization/locale/translate";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { editCatalogPermission } from "@ext/security/logic/Permission/Permissions";
import { useRef, useState } from "react";

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
	const catalogProps = CatalogPropsService.value;

	const canEditCatalog = PermissionService.useCheckPermission(
		editCatalogPermission,
		workspacePath,
		catalogProps.name,
	);

	const allowAddNewBranch = !isNext && canEditCatalog;

	return (
		<TabWrapper
			ref={tabWrapperRef}
			titleRightExtension={
				allowAddNewBranch && (
					<Icon
						style={{ fontSize: "1.35em", marginLeft: "-0.5em" }}
						isAction
						code="plus"
						tooltipContent={t("add-new-branch")}
						onClick={() => setIsInitNewBranch((prev) => !prev)}
					/>
				)
			}
			show={show}
			contentHeight={contentHeight}
			title={t("branches")}
			onClose={onClose}
		>
			<div>
				<BranchActions
					show={show}
					isInitNewBranch={isInitNewBranch}
					setIsInitNewBranch={setIsInitNewBranch}
					setShow={setShow}
					setContentHeight={setContentHeight}
					tabWrapperRef={tabWrapperRef}
					canEditCatalog={allowAddNewBranch}
					currentBranch={branchName}
					onMergeRequestCreate={onMergeRequestCreate}
					onNewBranch={async () => {
						await BranchUpdaterService.updateBranch(apiUrlCreator);
						await ArticleUpdaterService.update(apiUrlCreator);
					}}
				/>
			</div>
		</TabWrapper>
	);
};

export default BranchTab;
