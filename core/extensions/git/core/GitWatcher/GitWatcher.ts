import { GitCommands } from "../GitCommands/GitCommands";
import { GitVersion } from "../model/GitVersion";
import { GitStatus } from "./model/GitStatus";

export default class GitWatcher {
	private _onChanges: ((changes: GitStatus[]) => Promise<void>)[];
	constructor(private _gitRepository: GitCommands) {
		this._onChanges = [];
	}

	watch(onChange: (changes: GitStatus[]) => Promise<void>) {
		this._onChanges.push(onChange);
	}

	async checkChanges(oldVersion: GitVersion, newVersion: GitVersion): Promise<void> {
		if (!oldVersion || newVersion.compare(oldVersion)) return;
		const diff = await this._gitRepository.diff(oldVersion, newVersion);
		for (const f of this._onChanges) await f(diff);
	}
}
