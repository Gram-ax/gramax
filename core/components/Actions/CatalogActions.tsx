import ListItem from "@components/Layouts/CatalogLayout/RightNavigation/ListItem";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import DeleteCatalog from "@ext/catalog/actions/propsEditor/components/DeleteCatalog";
import useLocalize from "@ext/localization/useLocalize";
import { ItemLink } from "@ext/navigation/NavigationLinks";
import GetSharedTicket from "@ext/security/logic/TicketManager/components/GetSharedTicket";
import useIsReview from "@ext/storage/logic/utils/useIsReview";
import CatalogEditAction from "../../extensions/catalog/actions/propsEditor/components/CatalogEditAction";
import Share from "../../extensions/catalog/actions/share/components/Share";
import Healthcheck from "../../extensions/healthcheck/components/Healthcheck";
import useIsStorageInitialized from "../../extensions/storage/logic/utils/useIsStorageIniziliate";
import IsEditService from "../../ui-logic/ContextServices/IsEdit";
import IsReadOnlyHOC from "../../ui-logic/HigherOrderComponent/IsReadOnlyHOC";

const CatalogActions = ({ itemLinks }: { itemLinks: ItemLink[] }): JSX.Element => {
	const isEdit = IsEditService.value;
	const isLogged = PageDataContextService.value.isLogged;
	const storageInitialized = useIsStorageInitialized();
	const isReview = useIsReview();

	if (!isLogged) return null;

	return (
		<>
			{/*<ExportToDocxOrPdf*/}
			{/*	text={"catalog2"} Для Стаса: Зайди в компонент и посмотри как он работает*/}
			{/*	downloadLink: apiUrlCreator.getWordSaveUrl(),*/}
			{/*	fileName: catalogProps.name,*/}
			{/*/>*/}
			<Healthcheck
				itemLinks={itemLinks}
				trigger={<ListItem text={useLocalize("healthcheck")} iconCode="heart-pulse" />}
			/>
			<IsReadOnlyHOC>
				<GetSharedTicket trigger={<ListItem text={useLocalize("share")} iconCode="share-from-square" />} />
				<Share
					shouldRender={!isReview && storageInitialized}
					trigger={<ListItem text={useLocalize("share")} iconCode="share-from-square" />}
				/>
				<CatalogEditAction
					shouldRender={!isReview && isEdit}
					trigger={<ListItem text={useLocalize("catalogSettings")} iconCode="pen-to-square" />}
				/>
			</IsReadOnlyHOC>
			{isLogged && <DeleteCatalog />}
		</>
	);
};

export default CatalogActions;
