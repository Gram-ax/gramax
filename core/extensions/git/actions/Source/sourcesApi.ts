import ConfluenceServerSourceData from "@ext/confluence/core/server/model/ConfluenceServerSourceData.schema";
import ConfluenceCloudSourceData from "@ext/confluence/core/cloud/model/ConfluenceCloudSourceData";
import ConfluenceCloudAPI from "@ext/confluence/core/api/ConfluenceCloudAPI";
import ConfluenceServerAPI from "@ext/confluence/core/api/ConfluenceServerAPI";
import type GitHubSourceData from "@ext/git/actions/Source/GitHub/logic/GitHubSourceData";
import GithubSourceAPI from "@ext/git/actions/Source/GitHub/logic/GithubSourceAPI";
import GitlabSourceAPI from "@ext/git/actions/Source/GitLab/logic/GitlabSourceAPI";
import type GitlabSourceData from "@ext/git/actions/Source/GitLab/logic/GitlabSourceData";
import type { SourceAPI } from "@ext/git/actions/Source/SourceAPI";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import type SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

const sourcesAPI: Record<SourceType, (data: SourceData, authServiceUrl: string) => SourceAPI> = {
	Git: () => null,
	GitHub: (data, authServiceUrl) => new GithubSourceAPI(data as GitHubSourceData, authServiceUrl),
	GitLab: (data, authServiceUrl) => new GitlabSourceAPI(data as GitlabSourceData, authServiceUrl),
	"Confluence self-hosted server": (data) => new ConfluenceServerAPI(data as ConfluenceServerSourceData),
	"Confluence Cloud": (data, authServiceUrl) => new ConfluenceCloudAPI(data as ConfluenceCloudSourceData, authServiceUrl),
};

export default sourcesAPI;
