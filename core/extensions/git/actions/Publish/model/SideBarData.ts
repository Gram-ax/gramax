import { JSONContent } from "@tiptap/core";
import DiffFile from "../../../../VersionControl/model/DiffFile";
import SideBarResourceData from "./SideBarResourceData";

interface SideBarData extends Pick<DiffFile, "diff"> {
	isResource: boolean;
	parentPath?: string;
	data: {
		title: string;
		isChanged: boolean;
		resources: SideBarResourceData[];
		isChecked: boolean;
		logicPath?: string;
		newEditTree?: JSONContent;
		oldEditTree?: JSONContent;
		oldContent?: string;
		content?: string;
	} & Pick<DiffFile, "filePath" | "changeType">;
}

export default SideBarData;
