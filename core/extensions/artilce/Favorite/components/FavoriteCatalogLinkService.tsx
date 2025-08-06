import FavoriteService from "@ext/artilce/Favorite/components/FavoriteService";
import { CatalogLink } from "@ext/navigation/NavigationLinks";
import { createContext, useContext, useLayoutEffect, useState } from "react";
import ContextService from "../../../../ui-logic/ContextServices/ContextService";

export const GroupsServiceContext = createContext<CatalogLink[]>([]);

class FavoriteCatalogLinkService implements ContextService {
	Init({ children, value }: { children: JSX.Element; value: CatalogLink[] }): JSX.Element {
		const [favoriteCatalogLinks, setFavoriteCatalogLinks] = useState<CatalogLink[]>([]);
		const { catalogs } = FavoriteService.value;

		useLayoutEffect(() => {
			let favoriteCatalogLinks: CatalogLink[] = [];
			if (catalogs.length > 0) {
				favoriteCatalogLinks = value
					.filter((catalogLink) => catalogs.some((catalog) => catalog === catalogLink.name))
					.map((catalogLink) => ({ ...catalogLink, isFavorite: true }));
			}
			setFavoriteCatalogLinks(favoriteCatalogLinks);
		}, [catalogs, value]);

		return <GroupsServiceContext.Provider value={favoriteCatalogLinks}>{children}</GroupsServiceContext.Provider>;
	}

	get value(): CatalogLink[] {
		return useContext(GroupsServiceContext);
	}
}

export default new FavoriteCatalogLinkService();
