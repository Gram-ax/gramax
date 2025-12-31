import { useCatalogActionsContext } from "@components/Actions/CatalogActions/CatalogActionsContext";
import CatalogExport from "@ext/catalog/actions/propsEditor/components/CatalogExport";
import { ReactNode } from "react";

interface ExportCatalogItemProps {
	children?: () => ReactNode;
}

const ExportCatalogItem = ({ children }: ExportCatalogItemProps) => {
	const { isArticleExist } = useCatalogActionsContext();

	return <CatalogExport disabled={!isArticleExist}>{children}</CatalogExport>;
};

export default ExportCatalogItem;
