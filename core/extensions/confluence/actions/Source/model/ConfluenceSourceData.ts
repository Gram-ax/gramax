import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import SourceType from "../../../../storage/logic/SourceDataProvider/model/SourceType";

interface ConfluenceSourceData extends SourceData {
	sourceType: SourceType.confluence;
	cloudId: string;
	token: string;
	domain: string;
	refreshToken?: string;
}

export default ConfluenceSourceData;
