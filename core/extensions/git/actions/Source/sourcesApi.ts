import ConfluenceCloudAPI from "@ext/confluence/core/api/ConfluenceCloudAPI";
import ConfluenceServerAPI from "@ext/confluence/core/api/ConfluenceServerAPI";
import ConfluenceCloudSourceData from "@ext/confluence/core/cloud/model/ConfluenceCloudSourceData";
import ConfluenceServerSourceData from "@ext/confluence/core/server/model/ConfluenceServerSourceData.schema";
import NetworkApiError from "@ext/errorHandlers/network/NetworkApiError";
import type GitHubSourceData from "@ext/git/actions/Source/GitHub/logic/GitHubSourceData";
import GithubSourceAPI from "@ext/git/actions/Source/GitHub/logic/GithubSourceAPI";
import GitlabSourceAPI from "@ext/git/actions/Source/GitLab/logic/GitlabSourceAPI";
import type GitlabSourceData from "@ext/git/actions/Source/GitLab/logic/GitlabSourceData";
import type { SourceAPI } from "@ext/git/actions/Source/SourceAPI";
import NotionAPI from "@ext/notion/api/NotionAPI";
import NotionSourceData from "@ext/notion/model/NotionSourceData";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import type SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import YandexDiskSourceData from "@ext/yandexDisk/model/YandexDiskSourceData";
import YandexDiskServiceAPI from "@ext/yandexDisk/api/YandexDiskServiceAPI";

const sourcesAPI: Record<
	SourceType,
	(data: SourceData, authServiceUrl: string, onError?: (error: NetworkApiError) => void) => SourceAPI
> = {
	Git: () => null,
	GitHub: (data, authServiceUrl, onError) => new GithubSourceAPI(data as GitHubSourceData, authServiceUrl, onError),
	GitLab: (data, authServiceUrl, onError) => new GitlabSourceAPI(data as GitlabSourceData, authServiceUrl, onError),
	"Confluence self-hosted server": (data) => new ConfluenceServerAPI(data as ConfluenceServerSourceData),
	"Confluence Cloud": (data, authServiceUrl) =>
		new ConfluenceCloudAPI(data as ConfluenceCloudSourceData, authServiceUrl),
	"Yandex.Disk": (data, authServiceUrl) => new YandexDiskServiceAPI(data as YandexDiskSourceData, authServiceUrl),
	Notion: (data, authServiceUrl) => new NotionAPI(data as NotionSourceData, authServiceUrl),
};

export default sourcesAPI;
