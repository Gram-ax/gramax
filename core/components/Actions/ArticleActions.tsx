import EditInGramax from "@components/Actions/EditInGramax";
import ShowInExplorer from "@components/Actions/ShowInExplorer";
import ListItem from "@components/Layouts/CatalogLayout/RightNavigation/ListItem";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import IsReadOnlyHOC from "@core-ui/HigherOrderComponent/IsReadOnlyHOC";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import BugsnagLogsModal from "@ext/bugsnag/components/BugsnagLogsModal";
import EnterpriseCheckStyleGuide from "@ext/enterprise/components/EnterpriseCheckStyleGuide";
import t from "@ext/localization/locale/translate";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { editCatalogPermission } from "@ext/security/logic/Permission/Permissions";
import { FC, useEffect } from "react";
import FileEditor from "../../extensions/artilce/actions/FileEditor";
import History from "../../extensions/git/actions/History/component/History";

interface ArticleActionsProps {
	isCatalogExist: boolean;
	hasRenderableActions: (hasActionsToRender: boolean) => void;
}

const ArticleActions: FC<ArticleActionsProps> = ({ isCatalogExist, hasRenderableActions }) => {
	const articleProps = ArticlePropsService.value;
	const catalogProps = CatalogPropsService.value;
	const isArticleExist = !!articleProps.fileName;
	const workspacePath = WorkspaceService.current().path;
	const { isNext } = usePlatform();

	const canEditCatalog = PermissionService.useCheckPermission(
		editCatalogPermission,
		workspacePath,
		catalogProps.name,
	);

	const shouldShowEditInGramax = !isNext && (canEditCatalog || !catalogProps.sourceName);

	useEffect(() => {
		if (!isCatalogExist) return hasRenderableActions(true);
		if (shouldShowEditInGramax) return hasRenderableActions(true);
	});

	if (!isCatalogExist)
		return (
			<>
				<BugsnagLogsModal />
			</>
		);

	return (
		<>
			<IsReadOnlyHOC>
				<History key="history" />
				<BugsnagLogsModal key="bugsnag" />
				<FileEditor
					key="file-editor"
					trigger={
						<ListItem disabled={!isArticleExist} iconCode="file-pen" text={t("article.edit-markdown")} />
					}
				/>
			</IsReadOnlyHOC>
			{shouldShowEditInGramax && <EditInGramax key="edit-gramax" />}
			<ShowInExplorer />
			<EnterpriseCheckStyleGuide />
			{/* {isDevMode && <StyleGuideMenu />} */}
		</>
	);
};

export default ArticleActions;
