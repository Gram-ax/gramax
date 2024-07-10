import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import StorageData from "@ext/storage/models/StorageData";

export type SourceUser = {
	name: string;
	email: string;
	username: string;
	avatarUrl: string;
};

export interface SourceAPI {
	assertStorageExist(data: StorageData): Promise<void>;
	removeExpiredCredentials(apiUrlCreator: ApiUrlCreator): Promise<string>;
	isCredentialsValid(): Promise<boolean>;
	getUser(): Promise<SourceUser>;
}
