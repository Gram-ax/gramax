import type { ItemRefStatus } from "@ext/Watchers/model/ItemStatus";
import chokidar from "chokidar";
import Path from "../../logic/FileProvider/Path/Path";
import FileProvider from "../../logic/FileProvider/model/FileProvider";
import ItemExtensions from "../../logic/FileStructue/Item/ItemExtensions";
import { FileStatus } from "./model/FileStatus";
import Watcher from "./model/Watcher";

export default class ChokidarWatcher implements Watcher {
	private _onChanges: ((changes: ItemRefStatus[]) => void)[] = [];
	private _cache: { event: string; path: string }[] = [];
	private _changeItems: ItemRefStatus[] = [];
	private _watcher: chokidar.FSWatcher;
	private _ignoredRegExp = /(^|[/\\])\.git/;
	private _semaphore = 0;
	private _changeTypes = {
		change: FileStatus.modified,
		add: FileStatus.new,
		delete: FileStatus.delete,
		unlink: FileStatus.delete,
		moved: FileStatus.delete,
	};

	init(fp: FileProvider) {
		this._start(fp);
	}

	watch(onChange: (changes: ItemRefStatus[]) => void) {
		this._onChanges.push(onChange);
	}

	stop(): void {
		this._semaphore++;
	}

	start(): void {
		setTimeout(() => {
			if (this._semaphore > 0) this._semaphore--;
		}, 2000);
	}

	private _start(fp: FileProvider) {
		this._watcher = chokidar.watch(fp.rootPath + `/**/*.{${ItemExtensions.join(",")}}`, {
			ignoreInitial: true,
			persistent: true,
			ignored: this._ignoredRegExp,
			awaitWriteFinish: {
				stabilityThreshold: 1000,
				pollInterval: 100,
			},
		});

		this._watcher
			.on("all", (event, path) => {
				if (this._semaphore == 0) {
					this._cache.push({ event, path });
				}
			})
			.on("raw", (event, path) => {
				if (this._isRemovedDir(path, event)) {
					if (this._semaphore == 0) {
						this._cache.push({ event, path });
					}
				}
			});

		setInterval(() => {
			this._changeItems = [
				...this._cache.map(({ event, path }) => {
					const subDirectory = new Path(fp.rootPath.subDirectory(new Path(path)).value);
					return {
						ref: fp.getItemRef(subDirectory),
						status: this._changeTypes[event],
					};
				}),
				...this._changeItems,
			];
			this._cache = [];

			if (!!this._changeItems.length && this._semaphore == 0) {
				this._onChanges.forEach((e) => e(this._changeItems));
				this._changeItems = [];
			}
		}, 3000);
	}

	notify(): void {
		/* empty */
	}

	private _isRemovedDir(path: string, event: string): boolean {
		return !this._ignoredRegExp.test(path) && !new Path(path).extension && event == "moved";
	}
}
