import SourceData from "../../../storage/logic/SourceDataProvider/model/SourceData";
import SourceType from "../../../storage/logic/SourceDataProvider/model/SourceType";

/**
 * @see git-source-data
 */
interface GitSourceData extends SourceData {
	/**
	 * @default ""
	 */
	sourceType: SourceType.git | SourceType.gitHub | SourceType.gitLab;
	domain: string;
	token: string;
	protocol?: string;
	createDate?: string;
	refreshToken?: string;
	isEnterprise?: boolean;
}

export default GitSourceData;
