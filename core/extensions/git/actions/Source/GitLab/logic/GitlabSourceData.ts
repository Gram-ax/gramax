import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

interface GitlabSourceData extends GitSourceData {
	sourceType: SourceType.gitLab;
}

export default GitlabSourceData;
