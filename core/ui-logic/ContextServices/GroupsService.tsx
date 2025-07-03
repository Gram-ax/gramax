import { CatalogsLinks, type GroupData } from "@core/SitePresenter/SitePresenter";
import FavoriteService from "@ext/artilce/Favorite/components/FavoriteService";
import { FAVORITE_GROUP_NAME } from "@ext/artilce/Favorite/models/consts";
import { createContext, useContext, useLayoutEffect, useState } from "react";
import ContextService from "./ContextService";

export type GroupsServiceType = {
	catalogLinks: CatalogsLinks;
};

export const GroupsServiceContext = createContext<GroupsServiceType>({
	catalogLinks: {},
});

class GroupsService implements ContextService {
	private _setCatalogLinks: (catalogLinks: CatalogsLinks) => void = () => {};

	Init({ children, value }: { children: JSX.Element; value: CatalogsLinks }): JSX.Element {
		const [catalogLinks, setCatalogLinks] = useState<CatalogsLinks>(value);
		const { catalogs } = FavoriteService.value;

		this._setCatalogLinks = setCatalogLinks;

		useLayoutEffect(() => {
			const newCatalogLinks = { ...catalogLinks };

			if (catalogs.length > 0) {
				if (!newCatalogLinks[FAVORITE_GROUP_NAME]) {
					newCatalogLinks[FAVORITE_GROUP_NAME] = {
						catalogLinks: [],
						style: "small",
						title: FAVORITE_GROUP_NAME,
					};
				}

				const allExistingCatalogLinks = Object.values(value).flatMap((group) => group.catalogLinks);
				const favoriteCatalogLinksWithFlag = allExistingCatalogLinks
					.filter((catalogLink) => catalogs.some((catalog) => catalog === catalogLink.name))
					.map((catalogLink) => ({ ...catalogLink, isFavorite: true }));

				newCatalogLinks[FAVORITE_GROUP_NAME].catalogLinks = favoriteCatalogLinksWithFlag;
			} else {
				if (newCatalogLinks[FAVORITE_GROUP_NAME]) {
					delete newCatalogLinks[FAVORITE_GROUP_NAME];
				}
			}

			this._setCatalogLinks(this._rebuildCatalogLinks(newCatalogLinks));
		}, [catalogs.length]);

		return <GroupsServiceContext.Provider value={{ catalogLinks }}>{children}</GroupsServiceContext.Provider>;
	}

	get value(): GroupsServiceType {
		return useContext(GroupsServiceContext);
	}

	set value(catalogLinks: CatalogsLinks) {
		const newCatalogLinks = this._rebuildCatalogLinks(catalogLinks);
		this._setCatalogLinks(newCatalogLinks);
	}

	private _rebuildCatalogLinks(catalogLinks: CatalogsLinks): CatalogsLinks {
		const newCatalogLinks = {
			other: { catalogLinks: [] } as GroupData,
			null: { catalogLinks: [] } as GroupData,
			...catalogLinks,
		};
		const values = Object.values(newCatalogLinks);

		if (values.length > 2) {
			newCatalogLinks.other.catalogLinks =
				newCatalogLinks.null.catalogLinks.length > 0
					? [...newCatalogLinks.null.catalogLinks]
					: newCatalogLinks.other.catalogLinks;
			newCatalogLinks.null.catalogLinks = [];
		} else {
			newCatalogLinks.null.catalogLinks =
				newCatalogLinks.other.catalogLinks.length > 0
					? [...newCatalogLinks.other.catalogLinks]
					: newCatalogLinks.null.catalogLinks;
			newCatalogLinks.other.catalogLinks = [];
		}

		const finalCatalogLinks = newCatalogLinks[FAVORITE_GROUP_NAME]
			? {
					[FAVORITE_GROUP_NAME]: newCatalogLinks[FAVORITE_GROUP_NAME],
					...Object.fromEntries(
						Object.entries(newCatalogLinks).filter(([key]) => key !== FAVORITE_GROUP_NAME),
					),
			  }
			: newCatalogLinks;

		return finalCatalogLinks;
	}
}

export default new GroupsService();
