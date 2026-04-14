import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import type SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

interface GitVerseSourceData extends GitSourceData {
	sourceType: SourceType.gitVerse;
}

export default GitVerseSourceData;
