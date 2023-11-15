import ApiUrlCreator from "../../../../../../ui-logic/ApiServices/ApiUrlCreator";
import FetchService from "../../../../../../ui-logic/ApiServices/FetchService";
import MimeTypes from "../../../../../../ui-logic/ApiServices/Types/MimeTypes";
import getSourceNameByData from "../../../../../storage/logic/utils/getSourceNameByData";
import GitHubApi from "./GitHubApi";
import GitHubSourceData from "./GitHubSourceData";

const checkGitHubSource = async (source: GitHubSourceData, apiUrlCreator: ApiUrlCreator): Promise<string> => {
	if (!source) return null;
	const gitHubApi = new GitHubApi(source.token);
	if (await gitHubApi.tokenIsWorking()) return null;
	const removeSourceName = getSourceNameByData(source);

	if (!source.refreshToken) return removeSourceName;
	const newToken = await gitHubApi.refreshAccessToken(source.refreshToken);
	if (!newToken) return removeSourceName;

	source.token = newToken;
	await FetchService.fetch(apiUrlCreator.setSourceData(), JSON.stringify(source), MimeTypes.json);
};

export default checkGitHubSource;
