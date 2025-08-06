import CreateConfluenceCloudSourceData from "@ext/confluence/core/cloud/components/CreateConfluenceCloudSourceData";
import CreateConfluenceServerSourceData from "@ext/confluence/core/server/components/CreateConfluenceServerSourceData";
import CreateGitSourceData from "@ext/git/actions/Source/Git/components/CreateGitSourceData";
import CreateGitHubSourceData from "@ext/git/actions/Source/GitHub/components/CreateGitHubSourceData";
import CreateGitLabSourceData from "@ext/git/actions/Source/GitLab/components/CreateGitLabSourceData";
import CreateGitVerseSourceData from "@ext/git/actions/Source/GitVerse/components/CreateGitVerseSourceData";
import CreateNotionSourceData from "@ext/notion/components/CreateNotionSourceData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

const sourceComponents: Record<SourceType, React.ComponentType<any>> = {
	[SourceType.git]: CreateGitSourceData,
	[SourceType.gitLab]: CreateGitLabSourceData,
	[SourceType.gitHub]: CreateGitHubSourceData,
	[SourceType.gitVerse]: CreateGitVerseSourceData,
	[SourceType.confluenceCloud]: CreateConfluenceCloudSourceData,
	[SourceType.confluenceServer]: CreateConfluenceServerSourceData,
	[SourceType.notion]: CreateNotionSourceData,
};

export default sourceComponents;
