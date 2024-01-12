import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";

const getArticleResourceNames = async (apiUrlCreator: ApiUrlCreator): Promise<string[]> => {
	const response = await FetchService.fetch(apiUrlCreator.getArticleResourceNames());
	const names = await response.json();
	return names;
};

export default getArticleResourceNames;
