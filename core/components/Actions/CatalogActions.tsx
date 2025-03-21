import { TextSize } from "@components/Atoms/Button/Button";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import DeleteCatalog from "@ext/catalog/actions/propsEditor/components/DeleteCatalog";
import t from "@ext/localization/locale/translate";
import { ItemLink } from "@ext/navigation/NavigationLinks";
import { configureCatalogPermission } from "@ext/security/logic/Permission/Permissions";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import GetSharedTicket from "@ext/security/logic/TicketManager/components/GetSharedTicket";
import ItemExport, { ExportFormat } from "@ext/wordExport/components/ItemExport";
import { FC, useEffect, useRef } from "react";
import CatalogEditAction from "../../extensions/catalog/actions/propsEditor/components/CatalogEditAction";
import Healthcheck from "../../extensions/healthcheck/components/Healthcheck";
import IsReadOnlyHOC from "../../ui-logic/HigherOrderComponent/IsReadOnlyHOC";
import Share from "@ext/catalog/actions/share/components/Share";
import ExportButton from "@ext/wordExport/components/ExportButton";

interface CatalogActionsProps {
	isCatalogExist: boolean;
	itemLinks: ItemLink[];
}

const CatalogActions: FC<CatalogActionsProps> = ({ isCatalogExist, itemLinks }) => {
	const catalogProps = CatalogPropsService.value;
	const workspacePath = WorkspaceService.current().path;
	const { isNext } = usePlatform();
	const isReadOnly = PageDataContextService.value.conf.isReadOnly;
	const canConfigureCatalog = PermissionService.useCheckPermission(
		configureCatalogPermission,
		workspacePath,
		catalogProps.name,
	);
	const ref = useRef();

	useEffect(() => {
		if (!isCatalogExist) return;
	});

	if (!isCatalogExist) return null;

	const renderGetSharedTicket = () => (
		<GetSharedTicket trigger={<ButtonLink text={t("share.name.catalog")} iconCode="external-link" />} />
	);

	return (
		<PopupMenuLayout
			trigger={
				<div data-qa="qa-catalog-actions" style={{ marginRight: "-4px" }}>
					<ButtonLink textSize={TextSize.L} iconCode="ellipsis-vertical" />
				</div>
			}
			appendTo={() => document.body}
		>
			<PopupMenuLayout
				appendTo={() => ref.current}
				offset={[10, -5]}
				className="wrapper"
				placement="right-start"
				openTrigger="mouseenter focus"
				trigger={<ExportButton ref={ref} iconCode="file-output" text={t("export")} />}
			>
				<ItemExport fileName={catalogProps.name} exportFormat={ExportFormat.docx} />
				{canConfigureCatalog && isNext && renderGetSharedTicket()}
				<ItemExport fileName={catalogProps.name} exportFormat={ExportFormat.pdf} />
				{canConfigureCatalog && isNext && renderGetSharedTicket()}
			</PopupMenuLayout>
			{!isNext && catalogProps.sourceName && (
				<Share
					path={`/${catalogProps.link.pathname}`}
					trigger={<ButtonLink text={t("share.name.catalog")} iconCode="external-link" />}
					isArticle={false}
				/>
			)}
			<IsReadOnlyHOC>
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
