import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import SourceType from "../../../../../storage/logic/SourceDataProvider/model/SourceType";

interface GitHubSourceData extends GitSourceData {
	sourceType: SourceType.gitHub;
}

export default GitHubSourceData;
