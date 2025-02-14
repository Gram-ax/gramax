import { DiffFile, DiffFilePaths } from "@ext/VersionControl/model/Diff";
interface SideBarResourceData extends Pick<DiffFile, "hunks"> {
	isResource: true;
	parentPath?: DiffFilePaths;
	data: {
		title: string;
		added?: number;
		deleted?: number;
		content?: string;
		oldContent?: string;
	} & Pick<DiffFile, "status" | "filePath">;
}

export default SideBarResourceData;
