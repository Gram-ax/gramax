import { createEventEmitter, type Event } from "@core/Event/EventEmitter";
import type { DiffTree2TreeInfo } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import { GitVersion } from "../model/GitVersion";

export type GitWatcherEvents = Event<"update", DiffTree2TreeInfo>;

export default class GitWatcher {
	private _events = createEventEmitter<GitWatcherEvents>();

	constructor(private _gitVersionControl: GitVersionControl) {}

	watch(onChange: (changes: DiffTree2TreeInfo) => Promise<void>) {
		this._events.on("update", onChange);
	}

	async checkChanges(oldVersion: GitVersion, newVersion: GitVersion): Promise<void> {
		if (!oldVersion || newVersion.compare(oldVersion)) return;

		const diff = await this._gitVersionControl.diff({
			compare: {
				type: "tree",
				old: oldVersion,
				new: newVersion,
			},
			renames: false,
			// because two branches might not have a merge base (orphan branches)
			useMergeBase: false,
		});

		await this._events.emit("update", diff);
	}
}
