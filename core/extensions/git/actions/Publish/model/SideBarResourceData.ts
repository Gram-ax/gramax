import DiffFile from "../../../../VersionControl/model/DiffFile";

interface SideBarResourceData extends Pick<DiffFile, "diff"> {
	isResource: true;
	parentPath?: string;
	data: {
		title: string;
	} & Pick<DiffFile, "changeType" | "filePath">;
}

export default SideBarResourceData;
