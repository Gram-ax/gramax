import SourceType from "../../../../storage/logic/SourceDataProvider/model/SourceType";

export default interface ShareData {
	sourceType: SourceType;
	filePath: string;
	name: string;
}
