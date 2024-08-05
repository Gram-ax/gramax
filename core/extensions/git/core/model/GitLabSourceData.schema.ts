import SourceType from "../../../storage/logic/SourceDataProvider/model/SourceType";
import GitSourceData from "./GitSourceData.schema";

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
