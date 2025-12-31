import EditInGramax from "@components/Actions/EditInGramax";
import { ItemLink } from "@ext/navigation/NavigationLinks";
import ExportToDocxOrPdf from "@components/Actions/ExportToDocxOrPdf";
import IsReadOnlyHOC from "@core-ui/HigherOrderComponent/IsReadOnlyHOC";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import ShowInExplorer from "@components/Actions/ShowInExplorer";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";

interface ExportIntegrationArticleActionsProps {
	itemLink: ItemLink;
	isCategory: boolean;
	hasError: boolean;
	item: ClientArticleProps;
}

export const ExportIntegrationArticleActions = (props: ExportIntegrationArticleActionsProps) => {
	const isReadOnly = PageDataContextService.value.conf.isReadOnly;
	const { itemLink, isCategory, hasError, item } = props;
	if (!itemLink || (isReadOnly && hasError) || !item) return null;

	return (
		<>
			{!hasError && (
				<ExportToDocxOrPdf isCategory={isCategory} fileName={item.fileName} itemRefPath={itemLink.ref.path} />
			)}
			<IsReadOnlyHOC>
				<EditInGramax pathname={itemLink.pathname} articlePath={itemLink.ref.path} />
			</IsReadOnlyHOC>
			<ShowInExplorer item={item} />
		</>
	);
};
