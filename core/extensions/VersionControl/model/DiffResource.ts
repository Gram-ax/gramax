import DiffFile from "./DiffFile";

export default interface DiffResource extends DiffFile {
	type: "resource";
	parentPath?: string;
}
