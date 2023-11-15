import getSourceNameByData from "../../../../../storage/logic/utils/getSourceNameByData";
import GitSourceData from "../../../../core/model/GitSourceData.schema";
import GitLabApi from "./GitLabApi";

const checkGitLabSource = async (source: GitSourceData): Promise<string> => {
	if (!source) return null;
	const gitLabApi = new GitLabApi(source);
	const tokenIsWorking = await gitLabApi.tokenIsWorking();
	if (tokenIsWorking) return null;
	return getSourceNameByData(source);
};

export default checkGitLabSource;
