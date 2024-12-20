import CreateGitSourceData from "@ext/git/actions/Source/Git/components/CreateGitSourceData";
import CreateGitHubSourceData from "../../../../git/actions/Source/GitHub/components/CreateGitHubSourceData";
import CreateGitLabSourceData from "../../../../git/actions/Source/GitLab/components/CreateGitLabSourceData";
import CreateConfluenceCloudSourceData from "@ext/confluence/core/cloud/components/CreateConfluenceCloudSourceData";
import CreateConfluenceServerSourceData from "@ext/confluence/core/server/components/CreateConfluenceServerSourceData";
import CreateNotionSourceData from "@ext/notion/components/CreateNotionSourceData";
import SourceType from "../model/SourceType";
import CreateYandexDiskSourceData from "@ext/yandexDisk/components/CreateYandexDiskSourceData";

const sourceComponents = {
	[SourceType.git]: CreateGitSourceData,
	[SourceType.gitLab]: CreateGitLabSourceData,
	[SourceType.gitHub]: CreateGitHubSourceData,
	[SourceType.confluenceCloud]: CreateConfluenceCloudSourceData,
	[SourceType.confluenceServer]: CreateConfluenceServerSourceData,
	[SourceType.notion]: CreateNotionSourceData,
	[SourceType.yandexDisk]: CreateYandexDiskSourceData,
};

export default sourceComponents;
