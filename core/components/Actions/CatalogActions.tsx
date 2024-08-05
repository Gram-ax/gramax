import ListItem from "@components/Layouts/CatalogLayout/RightNavigation/ListItem";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import DeleteCatalog from "@ext/catalog/actions/propsEditor/components/DeleteCatalog";
import t from "@ext/localization/locale/translate";
import { ItemLink } from "@ext/navigation/NavigationLinks";
import GetSharedTicket from "@ext/security/logic/TicketManager/components/GetSharedTicket";
import useIsReview from "@ext/storage/logic/utils/useIsReview";
import ItemExport from "@ext/wordExport/components/ItemExport";
import CatalogEditAction from "../../extensions/catalog/actions/propsEditor/components/CatalogEditAction";
import Share from "../../extensions/catalog/actions/share/components/Share";
import Healthcheck from "../../extensions/healthcheck/components/Healthcheck";
import useIsStorageInitialized from "../../extensions/storage/logic/utils/useIsStorageIniziliate";
import IsEditService from "../../ui-logic/ContextServices/IsEdit";
import IsReadOnlyHOC from "../../ui-logic/HigherOrderComponent/IsReadOnlyHOC";

const CatalogActions = ({ itemLinks }: { itemLinks: ItemLink[] }): JSX.Element => {
	const isEdit = IsEditService.value;
	const isErrorArticle = ArticlePropsService.value.errorCode;
	const isLogged = PageDataContextService.value.isLogged;
	const conf = PageDataContextService.value.conf;
	const catalogProps = CatalogPropsService.value;
	const storageInitialized = useIsStorageInitialized();
	const isReview = useIsReview();

	if (!isLogged) return null;

	return (
		<>
			<Healthcheck itemLinks={itemLinks} trigger={<ListItem text={t("healthcheck")} iconCode="heart-pulse" />} />
			{conf.isServerApp && (
				<GetSharedTicket trigger={<ListItem text={t("share.name")} iconCode="external-link" />} />
			)}
			<IsReadOnlyHOC>
				<li>
					<ItemExport fileName={catalogProps.name} />
				</li>
				<Share
					shouldRender={!isReview && storageInitialized && !isErrorArticle}
					trigger={<ListItem text={t("share.name")} iconCode="external-link" />}
				/>
				<CatalogEditAction
					shouldRender={!isReview && isEdit}
					trigger={<ListItem text={t("catalog.configure")} iconCode="square-pen" />}
				/>
			</IsReadOnlyHOC>
			{isLogged && <DeleteCatalog />}
		</>
	);
};

export default CatalogActions;
