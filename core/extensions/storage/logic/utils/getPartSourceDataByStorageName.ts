import GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import GitSourceType from "@ext/git/core/model/GitSourceType";
import SourceType from "../SourceDataProvider/model/SourceType";

const getPartGitSourceDataByStorageName = (
	name: string,
): {
	sourceType: GitSourceType;
	data: Partial<GitSourceData>;
} => {
	if (!name) return { sourceType: null, data: {} };
	const lcName = name.toLowerCase();
	if (lcName.includes("github")) {
		return { sourceType: SourceType.gitHub, data: {} };
	}
	if (lcName.includes("gitlab")) {
		return { sourceType: SourceType.gitLab, data: { domain: name } };
	}
	if (lcName.includes("gitea")) {
		return { sourceType: SourceType.gitea, data: { domain: name } };
	}

	if (lcName.includes("gitverse")) {
		return { sourceType: SourceType.gitVerse, data: {} };
	}

	return { sourceType: SourceType.git, data: { domain: name } };
};

export default getPartGitSourceDataByStorageName;
