import { ARCHIVE_MERGE_REQUEST_PATH, MERGE_REQUEST_DIRECTORY_PATH, OPEN_MERGE_REQUEST_PATH } from "@app/config/const";
import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import { MergeRequestErrorCode } from "@ext/git/core/GitMergeRequest/errors/getMergeRequestErrors";
import LibGit2MergeRequestCommands from "@ext/git/core/GitMergeRequest/logic/LibGit2MergeRequestCommands";
import type { CreateMergeRequest, MergeRequest } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import type { MergeRequestCommandsModel } from "@ext/git/core/GitMergeRequest/model/MergeRequestCommandsModel";
import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import type Repository from "@ext/git/core/Repository/Repository";
import t from "@ext/localization/locale/translate";
import assert from "assert";

const DISABLED_ERROR_MESSAGE = "merge requests are disabled";

export default class MergeRequestProvider {
	private _mergeRequests: MergeRequestCommandsModel;
	private _cachedMergeRequests: MergeRequest[];

	constructor(
		private _fp: FileProvider,
		private _repoPath: Path,
		private _repo: Repository,
		private _disabled: boolean,
	) {
		this._mergeRequests = new LibGit2MergeRequestCommands(this._fp.rootPath.join(this._repoPath).value);
	}

	async list({ cached = true }: { cached?: boolean } = { cached: true }): Promise<MergeRequest[]> {
		if (this._disabled) return [];

		if (cached && this._cachedMergeRequests?.length) return this._cachedMergeRequests;
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
		if (this._disabled) return;

		return this._mergeRequests.tryGetDraft();
	}

	async isCreated(): Promise<boolean> {
		const sourceRef = await this._getSourceRef();
		const mr = await this.findBySource(sourceRef);
		const draft = await this.tryGetDraft();
		return !mr && !!draft;
	}

	async create(data: GitSourceData, mergeRequest: CreateMergeRequest): Promise<void> {
		assert(!this._disabled, DISABLED_ERROR_MESSAGE);

		assert(data, "data is required");
		assert(mergeRequest, "mergeRequest is required to create merge request");

		const sourceRef = await this._getSourceRef();

		if (await this.findBySource(sourceRef))
			throw new DefaultError(`Merge Request ${sourceRef} -> ${mergeRequest.targetBranchRef} already exists`);

		mergeRequest.createdAt = new Date();
		return this._createOrUpdateMergeRequest(data, mergeRequest);
	}

	async setApproval(data: GitSourceData, approve: boolean) {
		assert(!this._disabled, DISABLED_ERROR_MESSAGE);

		const mergeRequest = await this._findDraftOrFirstBySource(await this._getSourceRef());

		assert(mergeRequest, "merge request is required to set approval");

		const approver = mergeRequest.approvers?.find((a) => a.email === data.userEmail);
		assert(approver, "you need to be assigned to this merge request");

		approver.approvedAt = approve ? new Date() : null;

		await this._createOrUpdateMergeRequest(data, {
			targetBranchRef: mergeRequest.targetBranchRef,
			title: mergeRequest.title,
			description: mergeRequest.description,
			approvers: mergeRequest.approvers,
			options: mergeRequest.options,
		});
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

	async merge(data: GitSourceData, validateMerge = true) {
		assert(!this._disabled, DISABLED_ERROR_MESSAGE);

		const branch = await this._repo.gvc.getCurrentBranch();

		const mr = await this.findBySource(branch.toString());
		assert(mr, `no merge request found at ${branch.toString()}`);

		if (mr.creator.email !== data?.userEmail)
			throw new DefaultError("You are not the author of this merge request or storage is not connected");

		if (validateMerge) await this._repo.validateMerge();

		const { filename } = await this._archiveMrFile(branch.toString());
		await this._commitArchiveFile(filename, branch.toString(), mr.targetBranchRef, data);

		if (await this._repo.gvc.haveConflictsWithBranch(mr.targetBranchRef, data)) {
			await this._restoreArchiveFile();
			throw new DefaultError(
				t("git.merge-requests.error.merge-with-conflicts.body")
					.replaceAll("{{targetBranch}}", mr.targetBranchRef)
					.replaceAll("{{sourceBranch}}", branch.toString()),
				null,
				{ html: true },
				null,
				t("git.merge-requests.error.merge-with-conflicts.title"),
			);
		}

		await this._tryPublishArchiveFile(data);

		const mergeData = await this._repo.merge({
			data,
			targetBranch: mr.targetBranchRef,
			validateMerge,
			deleteAfterMerge: mr.options?.deleteAfterMerge,
			squash: mr.options?.squash,
			isMergeRequest: true,
		});

		try {
			if (mergeData.length) {
				// the code should never get here, but it's better to be safe
				throw new DefaultError(t("git.merge.conflict.abort-confirm.body.impossible-conflict"));
			}
		} finally {
			this._repo.gvc.update();
		}
	}

	private async _createOrUpdateMergeRequest(...args: Parameters<typeof this._mergeRequests.createOrUpdate>) {
		this._normalizeMergeRequest(args[1]);
		await this._mergeRequests.createOrUpdate(...args);
		await this._repo.gvc.add([MERGE_REQUEST_DIRECTORY_PATH]);
	}

	private _normalizeMergeRequest(mergeRequest: CreateMergeRequest): void {
		if (!mergeRequest?.approvers) return;

		for (const approver of mergeRequest.approvers) {
			if (!approver.email) continue;
			approver.email = approver.email.toLowerCase();
			if (approver.name && approver.name.toLowerCase() === approver.email)
				approver.name = approver.name.toLowerCase();
		}
	}

	private async _findDraftOrFirstBySource(sourceBranchRef: string): Promise<MergeRequest | undefined> {
		return (await this.tryGetDraft()) ?? (await this.list()).find((mr) => mr.sourceBranchRef === sourceBranchRef);
	}

	private async _getSourceRef() {
		const branch = await this._repo.gvc.getCurrentBranch();
		return branch.toString();
	}

	private async _archiveMrFile(sourceBranchRef: string): Promise<{ filename: string }> {
		const mr = await this.findBySource(sourceBranchRef);

		assert(mr, `merge request not found at ${sourceBranchRef}`);

		const filename = this._formatArchiveFilename(sourceBranchRef, mr.createdAt);
		const ARCHIVE_MERGE_REQUEST_FILENAME_PATH = ARCHIVE_MERGE_REQUEST_PATH.join(new Path(filename));

		if (!(await this._fp.exists(this._repoPath.join(ARCHIVE_MERGE_REQUEST_PATH))))
			await this._fp.mkdir(this._repoPath.join(ARCHIVE_MERGE_REQUEST_PATH));

		await this._fp.move(
			this._repoPath.join(OPEN_MERGE_REQUEST_PATH),
			this._repoPath.join(ARCHIVE_MERGE_REQUEST_FILENAME_PATH),
		);

		return { filename };
	}

	private async _commitArchiveFile(
		filename: string,
		sourceBranchRef: string,
		targetBranchRef: string,
		data: GitSourceData,
	) {
		const ARCHIVE_MERGE_REQUEST_FILENAME_PATH = ARCHIVE_MERGE_REQUEST_PATH.join(new Path(filename));

		await this._repo.gvc.commit(`Closing merge request ${sourceBranchRef} -> ${targetBranchRef}`, data, null, [
			OPEN_MERGE_REQUEST_PATH,
			ARCHIVE_MERGE_REQUEST_FILENAME_PATH,
		]);
	}

	private async _tryPublishArchiveFile(data: GitSourceData) {
		try {
			await this._repo.publish({ onlyPush: true, data });
		} catch (e) {
			// already restored
			await this._repo.gvc.reset({ mode: "hard" });
			throw e;
		}
	}

	private async _restoreArchiveFile() {
		await this._repo.gvc.restoreRepositoryState();
		await this._repo.gvc.reset({ mode: "hard" });
	}

	private _formatArchiveFilename(sourceBranchRef: string, createdAt: Date) {
		const datetime = createdAt?.toISOString().slice(0, 19).replace("T", "_").replaceAll(":", "-");
		const branch = sourceBranchRef.replace(/[`~!@#$%^&*_|+\-=?;:'",.<>{}[\]\\/\s]/gi, "-");

		return `${datetime}_${branch}.yaml`;
	}
}
