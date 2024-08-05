import GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import SourceType from "../SourceDataProvider/model/SourceType";

const getPartGitSourceDataByStorageName = (
	name: string,
): {
	sourceType: SourceType.git | SourceType.gitHub | SourceType.gitLab;
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

	return { sourceType: SourceType.git, data: { domain: name } };
};

export default getPartGitSourceDataByStorageName;
