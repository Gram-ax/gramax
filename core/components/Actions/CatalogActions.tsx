import ListItem from "@components/Layouts/CatalogLayout/RightNavigation/ListItem";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import DeleteCatalog from "@ext/catalog/actions/propsEditor/components/DeleteCatalog";
import t from "@ext/localization/locale/translate";
import { ItemLink } from "@ext/navigation/NavigationLinks";
import { configureCatalogPermission } from "@ext/security/logic/Permission/Permissions";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import GetSharedTicket from "@ext/security/logic/TicketManager/components/GetSharedTicket";
import useIsReview from "@ext/storage/logic/utils/useIsReview";
import ItemExport, { ExportFormat } from "@ext/wordExport/components/ItemExport";
import { FC, useEffect } from "react";
import CatalogEditAction from "../../extensions/catalog/actions/propsEditor/components/CatalogEditAction";
import Share from "../../extensions/catalog/actions/share/components/Share";
import Healthcheck from "../../extensions/healthcheck/components/Healthcheck";
import useIsStorageInitialized from "../../extensions/storage/logic/utils/useIsStorageInitialized";
import IsEditService from "../../ui-logic/ContextServices/IsEdit";
import IsReadOnlyHOC from "../../ui-logic/HigherOrderComponent/IsReadOnlyHOC";

interface CatalogActionsProps {
	isCatalogExist: boolean;
	itemLinks: ItemLink[];
	hasRenderableActions: (hasActionsToRender: boolean) => void;
}

const CatalogActions: FC<CatalogActionsProps> = ({ isCatalogExist, itemLinks, hasRenderableActions }) => {
	const isEdit = IsEditService.value;
	const isErrorArticle = ArticlePropsService.value.errorCode;
	const catalogProps = CatalogPropsService.value;
	const workspacePath = WorkspaceService.current().path;
	const storageInitialized = useIsStorageInitialized();
	const isReview = useIsReview();
	const { isNext } = usePlatform();
	const canConfigureCatalog = PermissionService.useCheckPermission(
		configureCatalogPermission,
		workspacePath,
		catalogProps.name,
	);

	useEffect(() => {
		if (!isCatalogExist) return;
		hasRenderableActions(true);
	});

	if (!isCatalogExist) return null;

	return (
		<>
			<li style={{ listStyleType: "none", width: "fit-content" }}>
				<ItemExport fileName={catalogProps.name} exportFormat={ExportFormat.docx} />
			</li>
			{canConfigureCatalog && isNext && (
				<GetSharedTicket trigger={<ListItem text={t("share.name")} iconCode="external-link" />} />
			)}
			<IsReadOnlyHOC>
				<Healthcheck
					itemLinks={itemLinks}
					trigger={<ListItem text={t("healthcheck")} iconCode="heart-pulse" />}
				/>
				<Share
					shouldRender={!isReview && storageInitialized && !isErrorArticle}
					trigger={<ListItem text={t("share.name")} iconCode="external-link" />}
				/>
				{canConfigureCatalog && (
					<CatalogEditAction
						shouldRender={!isReview && isEdit}
						trigger={<ListItem text={t("catalog.configure")} iconCode="square-pen" />}
					/>
				)}
			</IsReadOnlyHOC>
			{(canConfigureCatalog || !isNext) && <DeleteCatalog />}
		</>
	);
};

export default CatalogActions;
