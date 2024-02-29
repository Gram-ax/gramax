import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import type Branch from "@ext/VersionControl/model/branch/Branch";
import type StorageData from "@ext/storage/models/StorageData";

export type SourceUser = {
	name: string;
	email: string;
	username: string;
	avatarUrl: string;
};

export interface SourceAPI {
	removeExpiredCredentials(apiUrlCreator: ApiUrlCreator): Promise<string>;
	isCredentialsValid(): Promise<boolean>;
	getUser(): Promise<SourceUser>;
	isRepositoryExists(data: StorageData): Promise<boolean>;
	getAllProjects(): Promise<string[]>;

	getBranchWithFile(filename: string, data: StorageData): Promise<string>;
	isBranchContainsFile(filename: string, data: StorageData, branch: Branch): Promise<boolean>;
	getDefaultBranch(data: StorageData): Promise<string>;
	getAllBranches(data: StorageData, field?: string): Promise<string[]>;
}
