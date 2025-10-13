import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

interface GiteaSourceData extends GitSourceData {
	sourceType: SourceType.gitea;
}

export default GiteaSourceData;
