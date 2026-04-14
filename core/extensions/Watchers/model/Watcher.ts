import type FileProvider from "../../../logic/FileProvider/model/FileProvider";
import type { ItemRefStatus } from "./ItemStatus";

export default interface Watcher {
	init(fs: FileProvider): void;
	watch: (onChange: (changes: ItemRefStatus[]) => void) => void;
	stop(): void;
	start(): void;
	notify(changes: ItemRefStatus[]): void;
}
