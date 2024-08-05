import { ItemLink } from "@ext/navigation/NavigationLinks";
import { HomePageData } from "@core/SitePresenter/SitePresenter";
import { CatalogList, CatalogRef, CatalogNavigation, ArticleRef } from "@ext/publicApi/types";

const getListOfCatalogs = (homePageData: HomePageData): CatalogList => {
	const catalogRefs: CatalogRef[] = [];

	Object.values(homePageData.catalogLinks).forEach((groupData) => {
		groupData.catalogLinks.forEach((catalogLink) => {
			catalogRefs.push({
				id: catalogLink.name,
				title: catalogLink.title,
			});
		});
	});

	return { data: catalogRefs };
};

const getNavigation = (itemLinks: ItemLink[]): CatalogNavigation => {
	const excludeKeys = (children: ItemLink[]) =>
		children.map((item) =>
			Object.keys(item).reduce(
				(article, key) => {
					switch (key) {
						case "ref":
							article.id = item.ref.path;
							break;
						case "title":
							article.title = item.title;
							break;
						case "items":
							article.children = excludeKeys(item[key]);
							break;
					}
					return article;
				},
				{ id: null } as ArticleRef,
			),
		);
	return { data: excludeKeys(itemLinks) };
};

export default { getListOfCatalogs, getNavigation };
