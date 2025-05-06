import { TextSize } from "@components/Atoms/Button/Button";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import ButtonLink from "@components/Molecules/ButtonLink";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import DeleteCatalog from "@ext/catalog/actions/propsEditor/components/DeleteCatalog";
import Share from "@ext/catalog/actions/share/components/Share";
import t from "@ext/localization/locale/translate";
import { ItemLink } from "@ext/navigation/NavigationLinks";
import { configureCatalogPermission } from "@ext/security/logic/Permission/Permissions";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import GetSharedTicket from "@ext/security/logic/TicketManager/components/GetSharedTicket";
import UploadCloud from "@ext/static/components/UploadCloud";
import ExportButton from "@ext/wordExport/components/DropdownButton";
import ItemExport, { ExportFormat } from "@ext/wordExport/components/ItemExport";
import { FC, useRef } from "react";
import CatalogEditAction from "../../extensions/catalog/actions/propsEditor/components/CatalogEditAction";
import Healthcheck from "../../extensions/healthcheck/components/Healthcheck";
import IsReadOnlyHOC from "../../ui-logic/HigherOrderComponent/IsReadOnlyHOC";
// import getIsDevMode from "@core-ui/utils/getIsDevMode";
import Tooltip from "@components/Atoms/Tooltip";

interface CatalogActionsProps {
	isCatalogExist: boolean;
	itemLinks: ItemLink[];
	currentTab: LeftNavigationTab;
	setCurrentTab: (tab: LeftNavigationTab) => void;
}

const CatalogActions: FC<CatalogActionsProps> = ({ isCatalogExist, itemLinks, currentTab, setCurrentTab }) => {
	const catalogProps = CatalogPropsService.value;
	const workspacePath = WorkspaceService.current().path;
	const pageData = PageDataContextService.value;
	const { isNext, isBrowser } = usePlatform();
	const { isReadOnly, cloudServiceUrl } = pageData.conf;
	// const isTemplate = currentTab === LeftNavigationTab.Template;
	const isArticleExist = !!itemLinks.length;
	// const isInbox = currentTab === LeftNavigationTab.Inbox;

	const canConfigureCatalog = PermissionService.useCheckPermission(
		configureCatalogPermission,
		workspacePath,
		catalogProps.name,
	);
	const ref = useRef();
	// const [isDevMode] = useState(() => getIsDevMode());

	if (!isCatalogExist) return null;

	return (
		<PopupMenuLayout
			trigger={
				<div data-qa="qa-catalog-actions" style={{ marginRight: "-4px" }}>
					<ButtonLink textSize={TextSize.L} iconCode="ellipsis-vertical" />
				</div>
			}
			appendTo={() => document.body}
		>
			<Tooltip content={t("export-disabled")} disabled={isArticleExist}>
				<PopupMenuLayout
					appendTo={() => ref.current}
					offset={[10, -5]}
					className="wrapper"
					placement="right-start"
					openTrigger="mouseenter focus"
					disabled={!isArticleExist}
					trigger={
						<ExportButton disabled={!isArticleExist} ref={ref} iconCode="file-output" text={t("export")} />
					}
				>
					<ItemExport fileName={catalogProps.name} exportFormat={ExportFormat.docx} />
					<ItemExport fileName={catalogProps.name} exportFormat={ExportFormat.pdf} />
				</PopupMenuLayout>
			</Tooltip>
			{canConfigureCatalog && isNext && (
				<GetSharedTicket trigger={<ButtonLink text={t("share.name.catalog")} iconCode="external-link" />} />
			)}
			{!isNext && catalogProps.sourceName && (
				<Share
					path={`/${catalogProps.link.pathname}`}
					trigger={<ButtonLink text={t("share.name.catalog")} iconCode="external-link" />}
					isArticle={false}
				/>
			)}
			{isBrowser && cloudServiceUrl && <UploadCloud />}
			<IsReadOnlyHOC>
				{/* <ButtonLink
					text={t("template.name")}
					iconCode="layout-template"
					onClick={() => setCurrentTab(isTemplate ? LeftNavigationTab.None : LeftNavigationTab.Template)}
				/> */}
				{/* {isDevMode && (
					<ButtonLink
						text={"Inbox"}
						iconCode="inbox"
						onClick={() => setCurrentTab(isInbox ? LeftNavigationTab.None : LeftNavigationTab.Inbox)}
					/>
				)} */}
				<Healthcheck
					itemLinks={itemLinks}
					trigger={<ButtonLink text={t("check-errors")} iconCode="heart-pulse" />}
				/>
				{canConfigureCatalog && (
					<CatalogEditAction
						shouldRender={!isReadOnly}
						trigger={<ButtonLink text={t("catalog.configure")} iconCode="square-pen" />}
					/>
				)}
			</IsReadOnlyHOC>
			{(canConfigureCatalog || !isNext) && <DeleteCatalog style={{ margin: 0 }} />}
		</PopupMenuLayout>
	);
};

export default CatalogActions;
