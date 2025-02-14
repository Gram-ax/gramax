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
			renames: true,
		});
		await this._events.emit("update", diff);
	}

	async recursiveCheckChanges(
		oldVersion: GitVersion,
		newVersion: GitVersion,
		subOldVersions: { [path: string]: { version: GitVersion; subGvc: GitVersionControl } },
		subNewVersions: { [path: string]: { version: GitVersion; subGvc: GitVersionControl } },
	) {
		const finalDiff: DiffTree2TreeInfo = {
			hasChanges: false,
			added: 0,
			deleted: 0,
			files: [],
		};

		if (oldVersion && !newVersion.compare(oldVersion)) {
			const diff = await this._gitVersionControl.diff({
				compare: {
					type: "tree",
					old: oldVersion,
					new: newVersion,
				},
				renames: true,
			});
			finalDiff.hasChanges = diff.hasChanges;
			finalDiff.added = diff.added;
			finalDiff.deleted = diff.deleted;
			finalDiff.files = diff.files;
		}

		for (const [path, data] of Object.entries(subNewVersions)) {
			const oldVersion = subOldVersions[path]?.version;
			if (!oldVersion || oldVersion.compare(data.version)) continue;

			const diff = await data.subGvc.diff({
				compare: {
					type: "tree",
					old: oldVersion,
					new: data.version,
				},
				renames: true,
			});
			const fixedDiff = diff.files.map((d) => ({ ...d, path: data.subGvc.relativeToParentPath.join(d.path) }));

			finalDiff.hasChanges = finalDiff.hasChanges || diff.hasChanges;
			finalDiff.added += diff.added;
			finalDiff.deleted += diff.deleted;
			finalDiff.files.push(...fixedDiff);
		}

		await this._events.emit("update", finalDiff);
	}
}
