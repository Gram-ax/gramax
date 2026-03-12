import AddToFavoriteButton from "@ext/article/Favorite/components/AddToFavoriteButton";
import FavoriteService from "@ext/article/Favorite/components/FavoriteService";
import { useCallback } from "react";

export const ArticleFavoriteSettingsButton = ({ itemLinkPath }: { itemLinkPath: string }) => {
	const { articles } = FavoriteService.value;
	const isFavorite = articles.some((article) => article === itemLinkPath);

	const updateFavorite = useCallback(() => {
		const newFavoriteArticles = isFavorite
			? articles.filter((article) => article !== itemLinkPath)
			: [...articles, itemLinkPath];

		FavoriteService.setArticles(newFavoriteArticles);
	}, [articles, itemLinkPath, isFavorite]);

	return <AddToFavoriteButton isFavorite={isFavorite} onClick={updateFavorite} />;
};
