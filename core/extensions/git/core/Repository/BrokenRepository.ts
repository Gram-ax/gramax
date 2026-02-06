import { XxHash } from "@core/Hash/Hasher";
import GitErrorCode from "@ext/git/core/GitCommands/errors/model/GitErrorCode";
import GitCommands from "@ext/git/core/GitCommands/GitCommands";
import { resetFileLock } from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import BareRepository from "@ext/git/core/Repository/BareRepository";
import type { SharedCloneProgress } from "@ext/storage/logic/SharedCloneProgress";
import type { GitStorageCloneResult } from "@ext/storage/logic/StorageProvider";

export type RecoverOptions = {
	data: GitSourceData;
	progress: SharedCloneProgress;
};

export default class BrokenRepository extends BareRepository {
	private _error: Error;

	get error() {
		return this._error;
	}

	withError(error: Error) {
		this._error = error;
		return this;
	}

	async recover(opts: RecoverOptions): Promise<GitStorageCloneResult> {
		const { data, progress } = opts;

		const absoluteOut = this.absolutePath.value;
		const cancelToken = XxHash.hasher().hash(absoluteOut).finalize();
		let isCancelledByUser = false;

		progress.withCancelToken(cancelToken);
		progress.disableTimer();

		try {
			const git = new GitCommands(this._fp, this._repoPath);
			await git.recover(data, cancelToken, progress.setProgress.bind(progress));
		} catch (e) {
			const isCancelled =
				e.props?.errorCode === GitErrorCode.CancelledOperation ||
				e.cause?.props?.errorCode === GitErrorCode.CancelledOperation;

			if (isCancelled) {
				isCancelledByUser = true;
				return { isCancelledByUser };
			}

			throw e;
		}
	}

	async resetFileLock() {
		await resetFileLock({ repoPath: this._fp.rootPath.join(this._repoPath).value });
	}
}
