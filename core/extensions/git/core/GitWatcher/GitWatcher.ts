import { GitRepository } from "../GitRepository/GitRepository";
import { GitVersion } from "../model/GitVersion";
import { GitStatus } from "./model/GitStatus";

export default class GitWatcher {
	private _onChanges: ((changes: GitStatus[]) => void)[];
	constructor(private _gitRepository: GitRepository) {
		this._onChanges = [];
	}

	watch(onChange: (changes: GitStatus[]) => void) {
		this._onChanges.push(onChange);
	}

	async checkChanges(oldVersion: GitVersion, newVersion: GitVersion): Promise<void> {
		if (!oldVersion || newVersion.compare(oldVersion)) return;
		const diff = await this._gitRepository.diff(oldVersion, newVersion);
		this._onChanges.forEach((f) => f(diff));
	}
}
