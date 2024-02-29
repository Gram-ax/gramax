import type GitHubSourceData from "@ext/git/actions/Source/GitHub/logic/GitHubSourceData";
import GithubSourceAPI from "@ext/git/actions/Source/GitHub/logic/GithubSourceAPI";
import GitlabSourceAPI from "@ext/git/actions/Source/GitLab/logic/GitlabSourceAPI";
import type GitlabSourceData from "@ext/git/actions/Source/GitLab/logic/GitlabSourceData";
import type { SourceAPI } from "@ext/git/actions/Source/SourceAPI";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import type SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

const sourcesAPI: Record<SourceType, (data: SourceData, authServiceUrl: string) => SourceAPI> = {
	GitHub: (data, authServiceUrl) => new GithubSourceAPI(data as GitHubSourceData, authServiceUrl),
	GitLab: (data, authServiceUrl) => new GitlabSourceAPI(data as GitlabSourceData, authServiceUrl),
	"Enterprise Server": () => null,
};

export default sourcesAPI;
