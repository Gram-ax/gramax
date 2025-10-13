import GitSourceType from "@ext/git/core/model/GitSourceType";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";

/**
 * @see git-source-data
 */
interface GitSourceData extends SourceData {
	/**
	 * @default ""
	 */
	sourceType: GitSourceType;
	domain: string;
	/**
	 * @private
	 */
	token: string;
	protocol?: string;
	createDate?: string;
	refreshToken?: string;
	gitServerUsername?: string;
	isEnterprise?: boolean;
}

export default GitSourceData;
