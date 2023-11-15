import DiffFile from "./DiffFile";
import DiffResource from "./DiffResource";

export default interface DiffItem extends DiffFile {
	type: "item";
	resources: DiffResource[];
	logicPath?: string;
}
