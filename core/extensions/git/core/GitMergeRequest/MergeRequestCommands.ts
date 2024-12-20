import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import LibGit2MergeRequestCommands from "@ext/git/core/GitMergeRequest/LibGit2MergeRequestCommands";
import type { CreateMergeRequest, MergeRequest } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import type { MergeRequestCommandsModel } from "@ext/git/core/GitMergeRequest/model/MergeRequestCommandsModel";
import type Repository from "@ext/git/core/Repository/Repository";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import assert from "assert";

export default class MergeRequestProvider {
	private _mergeRequests: MergeRequestCommandsModel;

	private _cachedMergeRequests: MergeRequest[];

	constructor(private _fp: FileProvider, private _repoPath: Path, private _repo: Repository) {
		this._mergeRequests = new LibGit2MergeRequestCommands(this._fp.rootPath.join(this._repoPath).value);
	}

	async list({ cached = true }: { cached?: boolean } = { cached: true }): Promise<MergeRequest[]> {
		if (cached && this._cachedMergeRequests) return this._cachedMergeRequests;
		this._cachedMergeRequests = await this._mergeRequests.list();
		return this._cachedMergeRequests;
	}

	async findBySource(sourceBranchRef: string, cached = true): Promise<MergeRequest> {
		const mergeRequests = await this.list({ cached });
		return mergeRequests.find((mr) => mr.sourceBranchRef === sourceBranchRef);
	}

	async tryGetDraft(): Promise<MergeRequest | undefined> {
		return this._mergeRequests.tryGetDraft();
	}

	async create(data: SourceData, mergeRequest: CreateMergeRequest): Promise<void> {
		assert(data, "data is required");
		assert(mergeRequest, "mergeRequest is required to create merge request");

		const sourceRef = await this._getSourceRef();

		if (await this.findBySource(sourceRef))
			throw new Error(`Merge Request ${sourceRef} -> ${mergeRequest.targetBranchRef} already exists`);

		mergeRequest.createdAt = new Date();
		return this._mergeRequests.createOrUpdate(data, mergeRequest);
	}

	async setApproval(data: SourceData, approve: boolean) {
		const mergeRequest = await this._findDraftOrFirstBySource(await this._getSourceRef());

		assert(mergeRequest, "merge request is required to set approval");

		const assignee = mergeRequest.assignees?.find((a) => a.email === data.userEmail);
		assert(assignee, "you need to be assigned to this merge request");

		assignee.approvedAt = approve ? new Date() : null;

		await this._mergeRequests.createOrUpdate(data, {
			targetBranchRef: mergeRequest.targetBranchRef,
			title: mergeRequest.title,
			description: mergeRequest.description,
			assignees: mergeRequest.assignees,
			options: mergeRequest.options,
		});
	}

	async archive(sourceBranchRef: string): Promise<{ archiveFileName: string }> {
		const mr = await this.findBySource(sourceBranchRef);

		assert(mr, `merge request not found at ${sourceBranchRef}`);

		const filename = this._formatArchiveFilename(sourceBranchRef, mr.createdAt);

		if (!(await this._fp.exists(this._repoPath.join(new Path(`.gramax/mr/archive`)))))
			await this._fp.mkdir(this._repoPath.join(new Path(`.gramax/mr/archive`)));

		await this._fp.move(
			this._repoPath.join(new Path(".gramax/mr/open.yaml")),
			this._repoPath.join(new Path(`.gramax/mr/archive/${filename}`)),
		);

		return { archiveFileName: filename };
	}

	private async _findDraftOrFirstBySource(sourceBranchRef: string): Promise<MergeRequest | undefined> {
		return (await this.tryGetDraft()) ?? (await this.list()).find((mr) => mr.sourceBranchRef === sourceBranchRef);
	}

	private async _getSourceRef() {
		const branch = await this._repo.gvc.getCurrentBranch(true);
		return branch.toString();
	}

	private _formatArchiveFilename(sourceBranchRef: string, createdAt: Date) {
		const datetime = createdAt?.toISOString().slice(0, 19).replace("T", "_").replaceAll(":", "-");
		const branch = sourceBranchRef.replace(/[`~!@#$%^&*_|+\-=?;:'",.<>{}[\]\\/\s]/gi, "-");

		return `${datetime}_${branch}.yaml`;
	}
}
