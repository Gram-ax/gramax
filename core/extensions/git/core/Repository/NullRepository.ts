import type { GitMergeResultContent } from "@ext/git/actions/MergeConflictHandler/model/GitMergeResultContent";
import type { GitStatus } from "@ext/git/core/GitWatcher/model/GitStatus";
import Repository from "@ext/git/core/Repository/Repository";
import type RepositoryStateProvider from "@ext/git/core/Repository/state/RepositoryState";

export default class NullRepository extends Repository {
	static instance = new NullRepository();

	private constructor() {
		super(null, null, null, null);
	}

	checkoutIfCurrentBranchNotExist(): Promise<{ hasCheckout: boolean }> {
		return Promise.resolve({ hasCheckout: false });
	}

	publish(): Promise<void> {
		return Promise.resolve();
	}

	sync(): Promise<GitMergeResultContent[]> {
		return Promise.resolve([]);
	}

	checkout(): Promise<GitMergeResultContent[]> {
		return Promise.resolve([]);
	}

	validateMerge(): Promise<void> {
		return Promise.resolve();
	}

	merge(): Promise<GitMergeResultContent[]> {
		return Promise.resolve([]);
	}

	status(): Promise<GitStatus[]> {
		return Promise.resolve([]);
	}

	isShouldSync(): Promise<boolean> {
		return Promise.resolve(false);
	}

	canSync(): Promise<boolean> {
		return Promise.resolve(false);
	}

	deleteBranch(): Promise<void> {
		return Promise.resolve();
	}

	getState(): Promise<RepositoryStateProvider> {
		return Promise.resolve(null);
	}
}
