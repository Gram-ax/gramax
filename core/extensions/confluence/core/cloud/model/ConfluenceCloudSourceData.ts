import ConfluenceSourceData from "@ext/confluence/core/model/ConfluenceSourceData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

export default interface ConfluenceCloudSourceData extends ConfluenceSourceData {
	sourceType: SourceType.confluenceCloud;
	cloudId: string;
	refreshToken?: string;
}
