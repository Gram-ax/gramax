import type SourceType from "../../../storage/logic/SourceDataProvider/model/SourceType";
import type GitSourceData from "./GitSourceData.schema";

/**
 * @see gitlab-source-data
 */
interface GitLabSourceData extends GitSourceData {
	/**
	 * @default ""
	 */
	sourceType: SourceType.gitLab;
}

export default GitLabSourceData;
