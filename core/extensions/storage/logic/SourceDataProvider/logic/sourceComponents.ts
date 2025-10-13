import EditGit from "@ext/git/actions/Source/Git/components/EditGit";
import EditGitea from "@ext/git/actions/Source/Gitea/components/EditGitea";
import EditGitHub from "@ext/git/actions/Source/GitHub/components/EditGitHub";
import EditGitLab from "@ext/git/actions/Source/GitLab/components/EditGitLab";
import EditGitVerse from "@ext/git/actions/Source/GitVerse/components/EditGitVerse";
import EditConfluenceCloudForm from "@ext/import/components/EditConfluenceCloud";
import EditConfluenceServer from "@ext/import/components/EditConfluenceServer";
import EditNotion from "@ext/import/components/EditNotion";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

const sourceComponents: Record<SourceType, React.ComponentType<any>> = {
	[SourceType.git]: EditGit,
	[SourceType.gitLab]: EditGitLab,
	[SourceType.gitHub]: EditGitHub,
	[SourceType.gitVerse]: EditGitVerse,
	[SourceType.gitea]: EditGitea,
	[SourceType.confluenceCloud]: EditConfluenceCloudForm,
	[SourceType.confluenceServer]: EditConfluenceServer,
	[SourceType.notion]: EditNotion,
};

export default sourceComponents;
