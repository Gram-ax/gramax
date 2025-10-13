import EditInGramax from "@components/Actions/EditInGramax";
import ShowInExplorer from "@components/Actions/ShowInExplorer";
import useIsFileNew from "@components/Actions/useIsFileNew";
import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import FetchService from "@core-ui/ApiServices/FetchService";
import Method from "@core-ui/ApiServices/Types/Method";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import IsReadOnlyHOC from "@core-ui/HigherOrderComponent/IsReadOnlyHOC";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import ShareAction from "@ext/catalog/actions/share/components/ShareAction";
import EnterpriseCheckStyleGuide from "@ext/enterprise/components/EnterpriseCheckStyleGuide";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { editCatalogPermission } from "@ext/security/logic/Permission/Permissions";
import { FC, useCallback } from "react";
import History from "../../extensions/git/actions/History/component/HistoryTrigger";
import ArticleLinks from "@ext/properties/components/Helpers/ArticleLinks";
import BugsnagTrigger from "@ext/bugsnag/components/BugsnagTrigger";
import EditMarkdownTrigger from "@ext/artilce/actions/EditMarkdownTrigger";

interface ArticleActionsProps {
	item: ClientArticleProps;
	editLink: string;
	isCurrentItem: boolean;
	isCatalogExist: boolean;
	isTemplate: boolean;
}

const ArticleActions: FC<ArticleActionsProps> = ({ isCatalogExist, item, isCurrentItem, editLink, isTemplate }) => {
	const catalogProps = CatalogPropsService.value;
	const workspacePath = WorkspaceService.current().path;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { isNext, isStatic, isStaticCli } = usePlatform();

	const canEditCatalog = PermissionService.useCheckPermission(
		editCatalogPermission,
		workspacePath,
		catalogProps.name,
	);

	const shouldShowEditInGramax = !isNext && !isStatic && !isStaticCli && (canEditCatalog || !catalogProps.sourceName);

	const loadContent = useCallback(async () => {
		const res = await FetchService.fetch(apiUrlCreator.getArticleContent(item?.ref?.path));
		if (res.ok) return await res.json();
		return null;
	}, [apiUrlCreator, item?.ref?.path]);

	const saveContent = useCallback(
		async (content: string) => {
			const res = await FetchService.fetch(
				apiUrlCreator.setArticleContent(item?.ref?.path),
				content,
				MimeTypes.text,
				Method.POST,
				false,
			);
			if (!isCurrentItem || !res.ok) return refreshPage();
			ArticleUpdaterService.setUpdateData(await res.json());
			if (isCurrentItem && item.errorCode) refreshPage();
		},
		[apiUrlCreator, item?.ref?.path, isCurrentItem],
	);

	const isFileNew = useIsFileNew(item);

	if (!item) return null;

	if (!isCatalogExist) return <BugsnagTrigger itemLogicPath={item.logicPath} />;

	return (
		<>
			<IsReadOnlyHOC>
				<EditMarkdownTrigger
					loadContent={loadContent}
					saveContent={saveContent}
					disabled={isTemplate || !isCurrentItem}
				/>
				<ShareAction path={editLink} isArticle />
				<History key="history" item={item} isFileNew={isFileNew} />
				<BugsnagTrigger key="bugsnag" itemLogicPath={item.logicPath} />
			</IsReadOnlyHOC>
			<ArticleLinks itemRefPath={item.ref.path} />
			{shouldShowEditInGramax && (
				<EditInGramax pathname={editLink} articlePath={item.ref.path} key="edit-gramax" />
			)}
			<ShowInExplorer item={item} />
			{!item.errorCode && isCurrentItem && <EnterpriseCheckStyleGuide />}
		</>
	);
};

export default ArticleActions;
