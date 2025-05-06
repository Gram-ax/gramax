import { LibGit2BaseCommands } from "@ext/git/core/GitCommands/LibGit2BaseCommands";
import * as git from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import type { CreateMergeRequest, MergeRequest } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import type { MergeRequestCommandsModel } from "@ext/git/core/GitMergeRequest/model/MergeRequestCommandsModel";
import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import assert from "assert";

export default class LibGit2MergeRequestCommands extends LibGit2BaseCommands implements MergeRequestCommandsModel {
	constructor(repoPath: string) {
		super(repoPath);
	}

	list(): Promise<MergeRequest[]> {
		return git.listMergeRequests({ repoPath: this._repoPath });
	}

	createOrUpdate(data: GitSourceData, mergeRequest: CreateMergeRequest): Promise<void> {
		assert(mergeRequest, "merge request is required to create or update");
		assert(data, "source data is required to create or update merge request");

		return git.createOrUpdateMergeRequest({ repoPath: this._repoPath, mergeRequest, creds: this._intoCreds(data) });
	}

	tryGetDraft(): Promise<MergeRequest | undefined> {
		return git.getDraftMergeRequest({ repoPath: this._repoPath });
	}
}
