import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { SourceAPI, SourceUser } from "@ext/git/actions/Source/SourceAPI";
import { YandexDiskApiResponse } from "@ext/yandexDisk/api/model/YandexDiskAPITypes";

export default interface YandexAPI extends SourceAPI {
	getUser(): Promise<SourceUser>;
	isCredentialsValid(): Promise<boolean>;
	assertStorageExist(): Promise<void>;
	removeExpiredCredentials(apiUrlCreator: ApiUrlCreator): Promise<string>;
	isCredentialsValid(): Promise<boolean>;
	getFolderContents(path: string): Promise<YandexDiskApiResponse>;
	getFileDownloadLink(filePath: string): Promise<string>;
}
