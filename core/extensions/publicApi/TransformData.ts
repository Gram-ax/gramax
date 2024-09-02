import { ItemLink } from "@ext/navigation/NavigationLinks";
import { HomePageData } from "@core/SitePresenter/SitePresenter";
import { CatalogList, CatalogRef, CatalogNavigation, ArticleRef } from "@ext/publicApi/types";
import Path from "@core/FileProvider/Path/Path";

export const getArticleId = (catalogName: string, link: string) => {
	return new Path(catalogName).subDirectory(new Path(link))?.toString();
};

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

const getNavigation = (catalogName, itemLinks: ItemLink[]): CatalogNavigation => {
	const excludeKeys = (children: ItemLink[]) =>
		children.map((item) =>
			Object.keys(item).reduce(
				(article, key) => {
					switch (key) {
						case "pathname":
							article.id = getArticleId(catalogName, item.pathname);
							break;
						case "title":
							article.title = item.title;
							break;
						case "items":
							if (item[key].length > 0) article.children = excludeKeys(item[key]);
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
