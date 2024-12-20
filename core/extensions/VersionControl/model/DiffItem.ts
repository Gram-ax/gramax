import { JSONContent } from "@tiptap/core";
import DiffFile from "./DiffFile";
import DiffResource from "./DiffResource";

export default interface DiffItem extends DiffFile {
	type: "item";
	resources: DiffResource[];
	logicPath?: string;
	newEditTree?: JSONContent;
	oldEditTree?: JSONContent;
}
