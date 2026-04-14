import type ConfluenceSourceData from "@ext/confluence/core/model/ConfluenceSourceData";
import type SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

/**
 * @see confluence-server-source-data
 */
export default interface ConfluenceServerSourceData extends ConfluenceSourceData {
	sourceType: SourceType.confluenceServer;
}
