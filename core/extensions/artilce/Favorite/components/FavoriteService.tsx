import FavoriteProvider from "@ext/artilce/Favorite/logic/FavoriteProvider";
import { FavoriteArticle, FavoriteCatalog } from "@ext/artilce/Favorite/models/types";
import { createContext, useContext, useLayoutEffect, useState } from "react";
import Workspace from "@core-ui/ContextServices/Workspace";
import { PageProps } from "@components/ContextProviders";
import ContextService from "@core-ui/ContextServices/ContextService";
import { usePlatform } from "@core-ui/hooks/usePlatform";

export type FavoriteServiceType = {
	catalogs: FavoriteCatalog[];
	articles: FavoriteArticle[];
};

export const FavoriteServiceContext = createContext<FavoriteServiceType>({
	catalogs: [],
	articles: [],
});

class FavoriteService implements ContextService {
	private _setFavoriteArticles: (favoriteArticles: FavoriteArticle[]) => void = () => {};
	private _setFavoriteCatalogs: (favoriteCatalogs: FavoriteCatalog[]) => void = () => {};

	Init({ children, pageProps }: { children: JSX.Element; pageProps: PageProps }): JSX.Element {
		const [articles, setArticles] = useState<FavoriteArticle[]>([]);
		const [catalogs, setCatalogs] = useState<FavoriteCatalog[]>([]);

		const { isStatic, isStaticCli } = usePlatform();
		const workspace = Workspace.current();

		const setAndUpdateFavoriteArticles = (favoriteArticles: FavoriteArticle[]) => {
			setArticles(favoriteArticles);
			const provider = new FavoriteProvider(workspace.name);
			provider.setFavoriteArticlePaths(pageProps.data.catalogProps.name, favoriteArticles);
		};

		const setAndUpdateFavoriteCatalogs = (favoriteCatalogs: FavoriteCatalog[]) => {
			setCatalogs(favoriteCatalogs);
			const provider = new FavoriteProvider(workspace.name);
			provider.setFavoriteCatalogNames(favoriteCatalogs);
		};

		this._setFavoriteArticles = setAndUpdateFavoriteArticles;
		this._setFavoriteCatalogs = setAndUpdateFavoriteCatalogs;

		useLayoutEffect(() => {
			if (isStatic || isStaticCli || !workspace) return;
			const favoriteProvider = new FavoriteProvider(workspace.name);
			const favoriteCatalogNames = favoriteProvider.getFavoriteCatalogNames();

			setCatalogs(favoriteCatalogNames);
		}, [workspace?.name]);

		return (
			<FavoriteServiceContext.Provider value={{ articles, catalogs }}>{children}</FavoriteServiceContext.Provider>
		);
	}

	get value(): FavoriteServiceType {
		return useContext(FavoriteServiceContext);
	}

	fetchFavoriteArticles(workspaceName: string, catalogName: string) {
		const favoriteProvider = new FavoriteProvider(workspaceName);
		const favoriteArticles = favoriteProvider.getFavoriteArticlePaths(catalogName);
		this.setArticles(favoriteArticles);
	}

	setArticles(articles: FavoriteArticle[]) {
		this._setFavoriteArticles(articles);
	}

	setCatalogs(catalogs: FavoriteCatalog[]) {
		this._setFavoriteCatalogs(catalogs);
	}
}

export default new FavoriteService();
