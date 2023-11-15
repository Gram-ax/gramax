import SourceType from "../../../../storage/logic/SourceDataProvider/model/SourceType";

export default interface ShareLinkData {
	sourceType: SourceType;
	filePath: string;
	name: string;
}
