import { createEventEmitter, type Event } from "@core/Event/EventEmitter";
import GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import { GitVersion } from "../model/GitVersion";
import { GitStatus } from "./model/GitStatus";

export type GitWatcherEvents = Event<"update", GitStatus[]>;

export default class GitWatcher {
	private _events = createEventEmitter<GitWatcherEvents>();

	constructor(private _gitVersionControl: GitVersionControl) {}

	watch(onChange: (changes: GitStatus[]) => Promise<void>) {
		this._events.on("update", onChange);
	}

	async checkChanges(oldVersion: GitVersion, newVersion: GitVersion): Promise<void> {
		if (!oldVersion || newVersion.compare(oldVersion)) return;
		const diff = await this._gitVersionControl.diff(oldVersion, newVersion);
		await this._events.emit("update", diff);
	}

	async recursiveCheckChanges(
		oldVersion: GitVersion,
		newVersion: GitVersion,
		subOldVersions: { [path: string]: { version: GitVersion; subGvc: GitVersionControl } },
		subNewVersions: { [path: string]: { version: GitVersion; subGvc: GitVersionControl } },
	) {
		const diff: GitStatus[] = [];
		if (oldVersion && !newVersion.compare(oldVersion)) {
			diff.push(...(await this._gitVersionControl.diff(oldVersion, newVersion)));
		}

		for (const [path, data] of Object.entries(subNewVersions)) {
			const oldVersion = subOldVersions[path]?.version;
			if (!oldVersion || oldVersion.compare(data.version)) continue;

			const subDiff = await data.subGvc.diff(oldVersion, data.version);
			const convertedSubDiff = subDiff.map(
				(d): GitStatus => ({ ...d, path: data.subGvc.relativeToParentPath.join(d.path) }),
			);
			diff.push(...convertedSubDiff);
		}
		await this._events.emit("update", diff);
	}
}
