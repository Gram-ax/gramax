import FileProvider from "../../../logic/FileProvider/model/FileProvider";
import { ItemStatus } from "./ItemStatus";

export default interface Watcher {
	init(fs: FileProvider): void;
	watch: (onChange: (changes: ItemStatus[]) => void) => void;
	stop(): void;
	start(): void;
	notify(changes: ItemStatus[]): void;
}
