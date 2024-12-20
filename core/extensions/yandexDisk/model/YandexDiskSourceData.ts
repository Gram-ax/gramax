import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

export default interface YandexDiskSourceData extends SourceData {
	sourceType: SourceType.yandexDisk;
	domain: string;
	token: string;
	refreshToken?: string;
}
