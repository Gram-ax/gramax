import EditInGramax from "@components/Actions/EditInGramax";
import ShowInExplorer from "@components/Actions/ShowInExplorer";
import useIsFileNew from "@components/Actions/useIsFileNew";
import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import FetchService from "@core-ui/ApiServices/FetchService";
import Method from "@core-ui/ApiServices/Types/Method";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import IsReadOnlyHOC from "@core-ui/HigherOrderComponent/IsReadOnlyHOC";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import EditMarkdownTrigger from "@ext/article/actions/EditMarkdownTrigger";
import ArticleMoveAction from "@ext/article/actions/move/ArticleMoveAction";
import BugsnagTrigger from "@ext/bugsnag/components/BugsnagTrigger";
import ShareAction from "@ext/catalog/actions/share/components/ShareAction";
import EnterpriseCheckStyleGuide from "@ext/enterprise/components/EnterpriseCheckStyleGuide";
import t from "@ext/localization/locale/translate";
import ArticleLinks from "@ext/properties/components/Helpers/ArticleLinks";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { editCatalogPermission } from "@ext/security/logic/Permission/Permissions";
import { FC, useCallback } from "react";
import History from "../../extensions/git/actions/History/component/HistoryTrigger";

interface ArticleActionsProps {
	item: ClientArticleProps;
	editLink: string;
	isCurrentItem: boolean;
	isCatalogExist: boolean;
	isTemplate: boolean;
}

const getDisabledMarkdownInfo = (isTemplate: boolean, isCurrentItem: boolean) => {
	if (!isCurrentItem) {
		return { disabled: true, disabledTooltip: t("article.edit-markdown-disabled-not-current-item") };
	}
	if (isTemplate) return { disabled: true, disabledTooltip: t("article.edit-markdown-disabled-template") };

	return { disabled: false, disabledTooltip: undefined };
};

const ArticleActions: FC<ArticleActionsProps> = ({ isCatalogExist, item, isCurrentItem, editLink, isTemplate }) => {
	const workspacePath = WorkspaceService.current().path;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { isNext, isStatic, isStaticCli } = usePlatform();

	const { sourceName, catalogName } = useCatalogPropsStore((state) => ({
		sourceName: state.data?.sourceName,
		catalogName: state.data?.name,
	}));
	const canEditCatalog = PermissionService.useCheckPermission(editCatalogPermission, workspacePath, catalogName);
	const shouldShowEditInGramax = !isNext && !isStatic && !isStaticCli && (canEditCatalog || !sourceName);

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
					{...getDisabledMarkdownInfo(isTemplate, isCurrentItem)}
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
