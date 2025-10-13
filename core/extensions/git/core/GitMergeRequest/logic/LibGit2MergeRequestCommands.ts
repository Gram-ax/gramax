import getGitError from "@ext/git/core/GitCommands/errors/logic/getGitError";
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

	async list(): Promise<MergeRequest[]> {
		try {
			return await git.listMergeRequests({ repoPath: this._repoPath });
		} catch (error) {
			throw getGitError(error, { repoPath: this._repoPath });
		}
	}

	async createOrUpdate(data: GitSourceData, mergeRequest: CreateMergeRequest): Promise<void> {
		assert(mergeRequest, "merge request is required to create or update");
		assert(data, "source data is required to create or update merge request");

		try {
			return await git.createOrUpdateMergeRequest({
				repoPath: this._repoPath,
				mergeRequest,
				creds: this._intoCreds(data),
			});
		} catch (error) {
			throw getGitError(error, { repoPath: this._repoPath });
		}
	}

	async tryGetDraft(): Promise<MergeRequest | undefined> {
		try {
			return await git.getDraftMergeRequest({ repoPath: this._repoPath });
		} catch (error) {
			throw getGitError(error, { repoPath: this._repoPath });
		}
	}
}
