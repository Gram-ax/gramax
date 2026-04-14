import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import type SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

/**
 * @see gitverse-source-data
 */
interface GitVerseSourceData extends GitSourceData {
	/**
	 * @default ""
	 */
	sourceType: SourceType.gitVerse;
}

export default GitVerseSourceData;
