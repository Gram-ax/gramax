import { useCatalogActionsContext } from "@components/Actions/CatalogActions/CatalogActionsContext";
import CatalogItem from "@components/Actions/CatalogItems/Base";
import Icon from "@components/Atoms/Icon";
import { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import t from "@ext/localization/locale/translate";
import { ReactNode } from "react";

interface ViewFavoritesItemProps {
	children?: ReactNode;
}

const ViewFavoritesItem = ({ children }: ViewFavoritesItemProps) => {
	const { onToggleTab } = useCatalogActionsContext();

	return (
		<CatalogItem
			renderLabel={(Item) => (
				<Item onSelect={() => onToggleTab(LeftNavigationTab.FavoriteArticles)}>
					<Icon code="list-stars" />
					{t("favorites-articles")}
				</Item>
			)}
		>
			{children}
		</CatalogItem>
	);
};

export default ViewFavoritesItem;
