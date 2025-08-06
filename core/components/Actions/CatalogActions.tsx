import DownloadZip from "@components/Actions/DownloadZip";
import ShowInExplorer from "@components/Actions/ShowInExplorer";
import useShouldRenderDeleteCatalog from "@components/Actions/useShouldRenderDeleteCatalog";
import { TextSize } from "@components/Atoms/Button/Button";
import Tooltip from "@components/Atoms/Tooltip";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import ButtonLink from "@components/Molecules/ButtonLink";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import AddToFavoriteButton from "@ext/artilce/Favorite/components/AddToFavoriteButton";
import FavoriteService from "@ext/artilce/Favorite/components/FavoriteService";
import CatalogPropsEditor from "@ext/catalog/actions/propsEditor/components/CatalogPropsEditor";
import DeleteCatalog from "@ext/catalog/actions/propsEditor/components/DeleteCatalog";
import ShareAction from "@ext/catalog/actions/share/components/ShareAction";
import t from "@ext/localization/locale/translate";
import { ItemLink } from "@ext/navigation/NavigationLinks";
import { configureCatalogPermission } from "@ext/security/logic/Permission/Permissions";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import GetSharedTicket from "@ext/security/logic/TicketManager/components/GetSharedTicket";
import openCloudModal from "@ext/static/components/openCloudModal";
import useValidateDeleteCatalogInStatic from "@ext/static/logic/useValidateDeleteCatalogInStatic";
import ExportButton from "@ext/wordExport/components/DropdownButton";
import ItemExport, { ExportFormat } from "@ext/wordExport/components/ItemExport";
import { FC, useEffect, useRef, useState } from "react";
import Healthcheck from "../../extensions/healthcheck/components/Healthcheck";
import IsReadOnlyHOC from "../../ui-logic/HigherOrderComponent/IsReadOnlyHOC";
import { feature } from "@ext/toggleFeatures/features";

interface CatalogActionsProps {
	isCatalogExist: boolean;
	itemLinks: ItemLink[];
	currentTab: LeftNavigationTab;
	setCurrentTab: (tab: LeftNavigationTab) => void;
}

const CatalogActions: FC<CatalogActionsProps> = ({ isCatalogExist, itemLinks, currentTab, setCurrentTab }) => {
	const catalogProps = CatalogPropsService.value;
	const workspacePath = WorkspaceService.current()?.path;
	const pageData = PageDataContextService.value;
	const { isNext, isBrowser, isTauri, isStatic, isStaticCli } = usePlatform();
	const shouldRenderDeleteCatalog = useShouldRenderDeleteCatalog();
	const [renderDeleteCatalog, setRenderDeleteCatalog] = useState(false);
	const { isReadOnly, cloudServiceUrl } = pageData.conf;
	const isTemplate = currentTab === LeftNavigationTab.Template;
	const isArticleExist = !!itemLinks.length;
	const isInbox = currentTab === LeftNavigationTab.Inbox;
	const isSnippets = currentTab === LeftNavigationTab.Snippets;
	const isPrompt = currentTab === LeftNavigationTab.Prompt;
	const isFavoriteArticles = currentTab === LeftNavigationTab.FavoriteArticles;
	const isAiEnabled = pageData.conf.ai.enabled;
	const validateDeleteCatalogInStatic = useValidateDeleteCatalogInStatic();
	const { catalogs } = FavoriteService.value;

	const canConfigureCatalog = PermissionService.useCheckPermission(
		configureCatalogPermission,
		workspacePath,
		catalogProps.name,
	);

	useEffect(() => {
		setRenderDeleteCatalog(shouldRenderDeleteCatalog);
	}, []);

	const ref = useRef();

	if (!isCatalogExist) return null;

	const onClickFavorite = () => {
		const newFavoriteCatalogs = catalogs.find((catalog) => catalog === catalogProps.name)
			? catalogs.filter((catalog) => catalog !== catalogProps.name)
			: [...catalogs, catalogProps.name];

		FavoriteService.setCatalogs(newFavoriteCatalogs);
	};

	return (
		<PopupMenuLayout
			trigger={
				<div
					data-qa="qa-catalog-actions"
					style={{ marginRight: "-4px" }}
					onMouseEnter={async () => {
						if (!shouldRenderDeleteCatalog || !isStatic) return;
						setRenderDeleteCatalog(await validateDeleteCatalogInStatic());
					}}
				>
					<ButtonLink textSize={TextSize.L} iconCode="ellipsis-vertical" />
				</div>
			}
			appendTo={() => document.body}
		>
			{canConfigureCatalog && !isReadOnly && (
				<CatalogPropsEditor trigger={<ButtonLink text={t("catalog.configure")} iconCode="square-pen" />} />
			)}
			{canConfigureCatalog && isNext && (
				<GetSharedTicket trigger={<ButtonLink text={t("share.name.catalog")} iconCode="external-link" />} />
			)}
			{!isNext && catalogProps.sourceName && (
				<ShareAction path={`/${catalogProps.link.pathname}`} isArticle={false} />
			)}
			{isTauri && <ShowInExplorer />}
			<Tooltip content={t("export-disabled")} disabled={isArticleExist}>
				<PopupMenuLayout
					appendTo={() => ref.current}
					offset={[10, -5]}
					className="wrapper"
					placement="right-start"
					openTrigger="mouseenter focus"
					disabled={!isArticleExist}
					trigger={
						<ExportButton
							disabled={!isArticleExist}
							ref={ref}
							iconCode="file-output"
							text={t("export.name")}
						/>
					}
				>
					<ItemExport fileName={catalogProps.name} exportFormat={ExportFormat.docx} />
					<ItemExport fileName={catalogProps.name} exportFormat={ExportFormat.pdf} />
					<DownloadZip />
				</PopupMenuLayout>
			</Tooltip>

			{(isBrowser || isTauri) && cloudServiceUrl && feature("cloud") && (
				<ButtonLink text={t("cloud.publish-to-cloud")} iconCode="cloud-upload" onClick={openCloudModal} />
			)}
			{!isStaticCli && !isStatic && (
				<>
					<AddToFavoriteButton
						isFavorite={!!catalogs.find((catalog) => catalog === catalogProps.name)}
						onClick={onClickFavorite}
					/>
					<ButtonLink
						text={t("favorites-articles")}
						iconCode="star"
						onClick={() =>
							setCurrentTab(
								isFavoriteArticles ? LeftNavigationTab.None : LeftNavigationTab.FavoriteArticles,
							)
						}
					/>
				</>
			)}
			<IsReadOnlyHOC>
				<ButtonLink
					text={t("snippets")}
					iconCode="file"
					onClick={() => setCurrentTab(isSnippets ? LeftNavigationTab.None : LeftNavigationTab.Snippets)}
				/>
				<>
					<ButtonLink
						text={t("template.name")}
						iconCode="layout-template"
						onClick={() => setCurrentTab(isTemplate ? LeftNavigationTab.None : LeftNavigationTab.Template)}
					/>
					<ButtonLink
						text={t("inbox.notes")}
						iconCode="inbox"
						onClick={() => setCurrentTab(isInbox ? LeftNavigationTab.None : LeftNavigationTab.Inbox)}
					/>
				</>
				{isAiEnabled && (
					<ButtonLink
						text={t("ai.ai-prompts")}
						iconCode="square-chevron-right"
						onClick={() => setCurrentTab(isPrompt ? LeftNavigationTab.None : LeftNavigationTab.Prompt)}
					/>
				)}
				<Healthcheck
					itemLinks={itemLinks}
					trigger={<ButtonLink text={t("check-errors")} iconCode="heart-pulse" />}
				/>
			</IsReadOnlyHOC>
			{renderDeleteCatalog && <DeleteCatalog style={{ margin: 0 }} />}
		</PopupMenuLayout>
	);
};

export default CatalogActions;
