import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import CatalogEditAction from "../../extensions/catalog/actions/propsEditor/components/CatalogEditAction";
import Review from "../../extensions/catalog/actions/review/components/Review";
import Healthcheck from "../../extensions/healthcheck/components/Healthcheck";
import { ItemLink } from "../../extensions/navigation/NavigationLinks";
import useIsEnterprise from "../../extensions/storage/logic/utils/useIsEnterprise";
import useIsReview from "../../extensions/storage/logic/utils/useIsReview";
import useIsStorageInitialized from "../../extensions/storage/logic/utils/useIsStorageIniziliate";
import CatalogPropsService from "../../ui-logic/ContextServices/CatalogProps";
import IsEditService from "../../ui-logic/ContextServices/IsEdit";
import IsReadOnlyHOC from "../../ui-logic/HigherOrderComponent/IsReadOnlyHOC";

const CatalogActions = ({ itemLinks }: { itemLinks: ItemLink[] }): JSX.Element => {
	const isEdit = IsEditService.value;
	const readOnly = CatalogPropsService.value.readOnly;
	const isLogged = PageDataContextService.value.isLogged;
	const storageInitialized = useIsStorageInitialized();
	const enterpriseServerUrl = PageDataContextService.value?.conf.enterpriseServerUrl;
	const isEnterprise = useIsEnterprise(enterpriseServerUrl);
	const isReview = useIsReview();

	return (
		isLogged && (
			<>
				{/* <li>
				<ExportToDocxOrPdf
					text={useLocalize("catalog2")}
					wordLink={{
						downloadLink: apiUrlCreator.getWordSaveUrl(),
						fileName: catalogProps.name,
					}}
					pdfPart={<>PDF</>}
				/>
			</li> */}
				<li data-qa={`catalog-healthcheck-button`}>
					<Healthcheck itemLinks={itemLinks} />
				</li>
				<IsReadOnlyHOC>
					<>
						{!isReview && storageInitialized && isEnterprise && (
							<li>
								<Review />
							</li>
						)}
						{isEdit && !readOnly && !isReview && (
							<li>
								<CatalogEditAction />
							</li>
						)}
						{/* {catalogProps.storageType ? null : (
						<li>
						<InitVersionControl />
						</li>
						)} */}
					</>
				</IsReadOnlyHOC>
			</>
		)
	);
};

export default CatalogActions;
