import { useCatalogActionsContext } from "@components/Actions/CatalogActions/CatalogActionsContext";
import ShareAction from "@ext/catalog/actions/share/components/ShareAction";
import { ReactNode } from "react";

interface ShareCatalogItemProps {
	children?: ReactNode;
}

const ShareCatalogItem = ({ children }: ShareCatalogItemProps) => {
	const { pathName } = useCatalogActionsContext();

	return (
		<ShareAction isArticle={false} path={`/${pathName}`}>
			{children}
		</ShareAction>
	);
};

export default ShareCatalogItem;
