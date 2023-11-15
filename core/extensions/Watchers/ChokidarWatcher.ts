import chokidar from "chokidar";
import Path from "../../logic/FileProvider/Path/Path";
import FileProvider from "../../logic/FileProvider/model/FileProvider";
import ItemExtensions from "../../logic/FileStructue/Item/ItemExtensions";
import { FileStatus } from "./model/FileStatus";
import { ItemStatus } from "./model/ItemStatus";
import Watcher from "./model/Watcher";

export default class ChokidarWatcher implements Watcher {
	private _onChanges: ((changes: ItemStatus[]) => void)[] = [];
	private _cache: { event: string; path: string }[] = [];
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

	watch(onChange: (changes: ItemStatus[]) => void) {
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
			const tmp = this._cache.slice();
			this._cache = [];

			const changeItems: ItemStatus[] = tmp.map(({ event, path }) => {
				const subDirectory = new Path(fp.rootPath.subDirectory(new Path(path)).value);
				return {
					itemRef: fp.getItemRef(subDirectory),
					type: this._changeTypes[event],
				};
			});

			if (!!changeItems.length && this._semaphore == 0) this._onChanges.forEach((e) => e(changeItems));
		}, 3000);
	}

	notify(): void {
		/* empty */
	}

	private _isRemovedDir(path: string, event: string): boolean {
		return !this._ignoredRegExp.test(path) && !new Path(path).extension && event == "moved";
	}
}
