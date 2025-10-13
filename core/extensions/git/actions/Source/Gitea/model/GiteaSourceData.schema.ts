import GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

/**
 * @see gitea-source-data
 */
interface GiteaSourceData extends GitSourceData {
	/**
	 * @default ""
	 */
	sourceType: SourceType.gitea;
}

export default GiteaSourceData;
