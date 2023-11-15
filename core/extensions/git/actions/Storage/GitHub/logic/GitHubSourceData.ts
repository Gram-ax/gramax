import SourceType from "../../../../../storage/logic/SourceDataProvider/model/SourceType";
import GitSourceData from "../../../../core/model/GitSourceData.schema";

interface GitHubSourceData extends GitSourceData {
	createDate: string;
	refreshToken: string;
	sourceType: SourceType.gitHub;
}

export default GitHubSourceData;
