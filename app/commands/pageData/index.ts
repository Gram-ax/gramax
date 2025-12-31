import getArticlePageData from "./getArticlePageData";
import getCatalogNotFoundData from "./getCatalogNotFoundData";
import getHomePageData from "./getHomePageData";
import getPageData from "./getPageData";
import getScopedPageDataByArticleData from "./getPageDataByArticleData";
import getScopedPageDataByCatalog from "./getScopedPageDataByCatalog";

const page = {
	getScopedPageDataByArticleData,
	getScopedPageDataByCatalog,
	getCatalogNotFoundData,
	getArticlePageData,
	getHomePageData,
	getPageData,
};

export default page;
