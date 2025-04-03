import type ConfluenceSourceData from "@ext/confluence/core/model/ConfluenceSourceData";
import type GitHubSourceData from "@ext/git/actions/Source/GitHub/logic/GitHubSourceData";
import type GitLabSourceData from "@ext/git/core/model/GitLabSourceData.schema";
import type NotionSourceData from "@ext/notion/model/NotionSourceData";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";

const removeSourceTokenIfInvalid = (source: SourceData) => {
	const data: SourceData = source ? { ...source } : null;

	if (!data?.isInvalid) return data;

	delete (data as GitLabSourceData | ConfluenceSourceData | GitHubSourceData | NotionSourceData).token;
	delete (data as GitHubSourceData).refreshToken;

	return data;
};

export default removeSourceTokenIfInvalid;
