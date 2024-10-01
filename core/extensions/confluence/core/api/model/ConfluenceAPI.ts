import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { Space, UserLink } from "@ext/confluence/core/api/model/ConfluenceAPITypes";
import ConfluenceStorageData from "@ext/confluence/core/model/ConfluenceStorageData";
import { SourceAPI, SourceUser } from "@ext/git/actions/Source/SourceAPI";

export default interface ConfluenceAPI extends SourceAPI {
	getSpaces(): Promise<Space[]>;
	getArticles(storageData: ConfluenceStorageData): Promise<any>;
	getBlogs(storageData: ConfluenceStorageData): Promise<any>;
	getUserById(accountId: string): Promise<UserLink>;
	getUser(): Promise<SourceUser>;
	getPageAttachments(pageId: string): Promise<any>;
	getAttachmentData(fileName: string, articleId?: string);
	downloadAttachment(downloadLink: string);
	isCredentialsValid(): Promise<boolean>;
	removeExpiredCredentials(apiUrlCreator: ApiUrlCreator): Promise<string>;
	assertStorageExist(): Promise<void>;
}
