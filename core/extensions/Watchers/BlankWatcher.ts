/* eslint-disable @typescript-eslint/no-empty-function */
import Watcher from "./model/Watcher";

export default class BlankWatcher implements Watcher {
	init() {}
	watch() {}
	stop(): void {}
	start(): void {}
	notify(): void {}
}
