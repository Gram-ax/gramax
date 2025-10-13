import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

type GitSourceType = SourceType.git | SourceType.gitHub | SourceType.gitLab | SourceType.gitVerse | SourceType.gitea;

export default GitSourceType;
