import { useCatalogActionsContext } from "@components/Actions/CatalogActions/CatalogActionsContext";
import ItemExport, { ExportFormat } from "@ext/wordExport/components/ItemExport";

interface ExportMenuItemProps {
	exportFormat: ExportFormat;
}

const ExportMenuItem = ({ exportFormat }: ExportMenuItemProps) => {
	const { catalogName } = useCatalogActionsContext();

	return <ItemExport fileName={catalogName} exportFormat={exportFormat} />;
};

export default ExportMenuItem;
