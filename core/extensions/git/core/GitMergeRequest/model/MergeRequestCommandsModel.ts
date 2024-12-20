import type { CreateMergeRequest, MergeRequest } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";

export interface MergeRequestCommandsModel {
	list(): Promise<MergeRequest[]>;
	createOrUpdate(data: SourceData, mergeRequest: CreateMergeRequest): Promise<void>;
	tryGetDraft(): Promise<MergeRequest | undefined>;
}
