import SideBarResourceData from "@ext/git/actions/Publish/model/SideBarResourceData";
import { DiffFile, DiffFilePaths } from "@ext/VersionControl/model/Diff";
import { JSONContent } from "@tiptap/core";

interface SideBarData extends Pick<DiffFile, "hunks"> {
	isResource: boolean;
	parentPath?: DiffFilePaths;
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
		added?: number;
		deleted?: number;
	} & Pick<DiffFile, "filePath" | "status">;
}

export default SideBarData;
