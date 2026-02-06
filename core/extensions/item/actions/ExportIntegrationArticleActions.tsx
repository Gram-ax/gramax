import EditInGramax from "@components/Actions/EditInGramax";
import ExportToDocxOrPdf from "@components/Actions/ExportToDocxOrPdf";
import ShowInExplorer from "@components/Actions/ShowInExplorer";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import IsReadOnlyHOC from "@core-ui/HigherOrderComponent/IsReadOnlyHOC";
import { ItemLink } from "@ext/navigation/NavigationLinks";

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
				<ExportToDocxOrPdf fileName={item.fileName} isCategory={isCategory} itemRefPath={itemLink.ref.path} />
			)}
			<IsReadOnlyHOC>
				<EditInGramax articlePath={itemLink.ref.path} pathname={itemLink.pathname} />
			</IsReadOnlyHOC>
			<ShowInExplorer item={item} />
		</>
	);
};
