import FetchService from "@core-ui/ApiServices/FetchService";
import type Url from "@core-ui/ApiServices/Types/Url";
import type { PropertyFilter, ResourceFilter, SearchResult } from "@ext/serach/Searcher";
import { buildArticleRows, type RowSearchResult } from "@ext/serach/utils/SearchRowsModel";

interface GetSearchDataArgs {
	url: Url;
	signal: AbortSignal;
	propertyFilter?: PropertyFilter;
	resourceFilter: ResourceFilter;
	articleRefPath?: string;
	onlyArticles: boolean;
}

export const getSearchData = async ({
	url,
	propertyFilter,
	resourceFilter,
	articleRefPath,
	signal,
	onlyArticles,
}: GetSearchDataArgs): Promise<RowSearchResult[] | undefined> => {
	const res = await FetchService.fetch<SearchResult[]>(
		url,
		JSON.stringify({ resourceFilter, propertyFilter, articleRefPath }),
		undefined,
		undefined,
		undefined,
		undefined,
		signal,
	);
	if (!res.ok || signal.aborted) return;

	const searchData = await res.json();
	const articleSearchData = searchData.filter((d) => !onlyArticles || d.type === "article");

	const { rows } = buildArticleRows(articleSearchData);

	return rows;
};
