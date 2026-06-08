import getArticlePageData from "./getArticlePageData";
import getCatalogNotFoundData from "./getCatalogNotFoundData";
import getDiffModeArticlePageData from "./getDiffModeArticlePageData";
import getHomePageData from "./getHomePageData";
import getPageData from "./getPageData";
import getScopedPageDataByArticleData from "./getScopedPageDataByArticleData";
import getScopedPageDataByCatalog from "./getScopedPageDataByCatalog";

const page = {
	getScopedPageDataByArticleData,
	getScopedPageDataByCatalog,
	getCatalogNotFoundData,
	getArticlePageData,
	getDiffModeArticlePageData,
	getHomePageData,
	getPageData,
};

export default page;
