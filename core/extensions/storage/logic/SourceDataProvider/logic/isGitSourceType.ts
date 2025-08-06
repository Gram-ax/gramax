import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

const isGitSourceType = (sourceType: SourceType) =>
	[SourceType.git, SourceType.gitHub, SourceType.gitLab, SourceType.gitVerse].includes(sourceType);

export default isGitSourceType;
