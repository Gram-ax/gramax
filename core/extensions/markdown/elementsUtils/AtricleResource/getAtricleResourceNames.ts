import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";

const getArticleFileBrotherNames = async (
	apiUrlCreator: ApiUrlCreator,
	itemId?: string,
	providerType?: ArticleProviderType,
): Promise<string[]> => {
	const response = await FetchService.fetch(apiUrlCreator.getArticleFileBrotherNames(itemId, providerType));
	const names = await response.json();
	return names;
};

export default getArticleFileBrotherNames;
