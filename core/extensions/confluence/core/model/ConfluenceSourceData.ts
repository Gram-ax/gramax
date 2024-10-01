import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import SourceType from "../../../storage/logic/SourceDataProvider/model/SourceType";

export default interface ConfluenceSourceData extends SourceData {
	sourceType: SourceType.confluenceCloud | SourceType.confluenceServer;
	domain: string;
	token: string;
}
