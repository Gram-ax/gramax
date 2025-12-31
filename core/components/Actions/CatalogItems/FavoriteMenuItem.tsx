import { useCatalogActionsContext } from "@components/Actions/CatalogActions/CatalogActionsContext";
import FavoriteService from "@ext/article/Favorite/components/FavoriteService";
import AddToFavoriteButton from "@ext/article/Favorite/components/AddToFavoriteButton";
import { ReactNode, useCallback } from "react";

interface FavoriteMenuItemProps {
	children?: ReactNode;
}

const FavoriteMenuItem = ({ children }: FavoriteMenuItemProps) => {
	const { catalogName } = useCatalogActionsContext();
	const { catalogs } = FavoriteService.value;
	const isFavorite = !!catalogs.find((c) => c === catalogName);

	const onClickFavorite = useCallback(() => {
		const newFavoriteCatalogs = isFavorite
			? catalogs.filter((catalog) => catalog !== catalogName)
			: [...catalogs, catalogName];

		FavoriteService.setCatalogs(newFavoriteCatalogs);
	}, [catalogName, catalogs, isFavorite]);

	return (
		<AddToFavoriteButton isFavorite={isFavorite} onClick={onClickFavorite}>
			{children}
		</AddToFavoriteButton>
	);
};

export default FavoriteMenuItem;
