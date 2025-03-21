import EditInGramax from "@components/Actions/EditInGramax";
import ShowInExplorer from "@components/Actions/ShowInExplorer";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import IsReadOnlyHOC from "@core-ui/HigherOrderComponent/IsReadOnlyHOC";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import BugsnagLogsModal from "@ext/bugsnag/components/BugsnagLogsModal";
import EnterpriseCheckStyleGuide from "@ext/enterprise/components/EnterpriseCheckStyleGuide";
import t from "@ext/localization/locale/translate";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { editCatalogPermission } from "@ext/security/logic/Permission/Permissions";
import { FC } from "react";
import FileEditor from "../../extensions/artilce/actions/FileEditor";
import History from "../../extensions/git/actions/History/component/History";
import ButtonLink from "@components/Molecules/ButtonLink";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import Share from "@ext/catalog/actions/share/components/Share";

interface ArticleActionsProps {
	item: ClientArticleProps;
	editLink: string;
	isCurrentItem: boolean;
	isCatalogExist: boolean;
}

const ArticleActions: FC<ArticleActionsProps> = ({ isCatalogExist, item, isCurrentItem, editLink }) => {
	const catalogProps = CatalogPropsService.value;
	const workspacePath = WorkspaceService.current().path;
	const { isNext } = usePlatform();

	const canEditCatalog = PermissionService.useCheckPermission(
		editCatalogPermission,
		workspacePath,
		catalogProps.name,
	);

	const shouldShowEditInGramax = !isNext && (canEditCatalog || !catalogProps.sourceName);

	if (!item) return null;

	if (!isCatalogExist) return <BugsnagLogsModal itemLogicPath={item.logicPath} />;

	return (
		<>
			{!isNext && catalogProps.sourceName && (
				<Share
					path={editLink}
					trigger={<ButtonLink text={t("share.name.article")} iconCode="external-link" />}
				/>
			)}
			<IsReadOnlyHOC>
				<History key="history" item={item} />
				<BugsnagLogsModal key="bugsnag" itemLogicPath={item.logicPath} />
				<FileEditor
					key="file-editor"
					isCurrentItem={isCurrentItem}
					item={item}
					trigger={<ButtonLink iconCode="file-pen" text={t("article.edit-markdown")} />}
				/>
			</IsReadOnlyHOC>
			{shouldShowEditInGramax && (
				<EditInGramax pathname={editLink} articlePath={item.ref.path} key="edit-gramax" />
			)}
			<ShowInExplorer item={item} />
			{!item.errorCode && isCurrentItem && <EnterpriseCheckStyleGuide />}
			{/* {isDevMode && <StyleGuideMenu />} */}
		</>
	);
};

export default ArticleActions;
