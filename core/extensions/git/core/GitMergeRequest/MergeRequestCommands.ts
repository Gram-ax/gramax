import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import { MergeRequestErrorCode } from "@ext/git/core/GitMergeRequest/errors/getMergeRequestErrors";
import LibGit2MergeRequestCommands from "@ext/git/core/GitMergeRequest/LibGit2MergeRequestCommands";
import type { CreateMergeRequest, MergeRequest } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import type { MergeRequestCommandsModel } from "@ext/git/core/GitMergeRequest/model/MergeRequestCommandsModel";
import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import type Repository from "@ext/git/core/Repository/Repository";
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

	listArchives(): Promise<MergeRequest[]> {
		throw new Error("Not Implemented");
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	findArchiveBySource(sourceBranchRef: string): Promise<MergeRequest | undefined> {
		throw new Error("Not Implemented");
	}

	async tryGetDraft(): Promise<MergeRequest | undefined> {
		return this._mergeRequests.tryGetDraft();
	}

	async isCreated(): Promise<boolean> {
		const sourceRef = await this._getSourceRef();
		const mr = await this.findBySource(sourceRef);
		const draft = await this.tryGetDraft();
		return !mr && !!draft;
	}

	async create(data: GitSourceData, mergeRequest: CreateMergeRequest): Promise<void> {
		assert(data, "data is required");
		assert(mergeRequest, "mergeRequest is required to create merge request");

		const sourceRef = await this._getSourceRef();

		if (await this.findBySource(sourceRef))
			throw new Error(`Merge Request ${sourceRef} -> ${mergeRequest.targetBranchRef} already exists`);

		mergeRequest.createdAt = new Date();
		return this._mergeRequests.createOrUpdate(data, mergeRequest);
	}

	async setApproval(data: GitSourceData, approve: boolean) {
		const mergeRequest = await this._findDraftOrFirstBySource(await this._getSourceRef());

		assert(mergeRequest, "merge request is required to set approval");

		const approver = mergeRequest.approvers?.find((a) => a.email === data.userEmail);
		assert(approver, "you need to be assigned to this merge request");

		approver.approvedAt = approve ? new Date() : null;

		  await this._mergeRequests.createOrUpdate(data, {
			targetBranchRef: mergeRequest.targetBranchRef,
			title: mergeRequest.title,
			description: mergeRequest.description,
			approvers: mergeRequest.approvers,
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

	async afterSync(prev: MergeRequest, data: GitSourceData) {
		if (!prev) return;
		if (prev.creator.email === data.userEmail) return;
		if (!prev.approvers || !prev.approvers?.find((a) => a.email === data.userEmail)) return;

		const currentBranch = await this._repo.gvc.getCurrentBranch();
		const remoteBranchWasDeleted = !currentBranch.getData().remoteName;
		if (remoteBranchWasDeleted) {
			await this._repo.checkoutToDefaultBranch(data, true);
			await this._repo.gvc.deleteLocalBranch(currentBranch.toString());
			throw new DefaultError(null, null, { errorCode: MergeRequestErrorCode.BranchWasDeleted });
		}
	}

	private async _findDraftOrFirstBySource(sourceBranchRef: string): Promise<MergeRequest | undefined> {
		return (await this.tryGetDraft()) ?? (await this.list()).find((mr) => mr.sourceBranchRef === sourceBranchRef);
	}

	private async _getSourceRef() {
		const branch = await this._repo.gvc.getCurrentBranch();
		return branch.toString();
	}

	private _formatArchiveFilename(sourceBranchRef: string, createdAt: Date) {
		const datetime = createdAt?.toISOString().slice(0, 19).replace("T", "_").replaceAll(":", "-");
		const branch = sourceBranchRef.replace(/[`~!@#$%^&*_|+\-=?;:'",.<>{}[\]\\/\s]/gi, "-");

		return `${datetime}_${branch}.yaml`;
	}
}
