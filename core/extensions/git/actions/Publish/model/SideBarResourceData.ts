import DiffFile from "../../../../VersionControl/model/DiffFile";

interface SideBarResourceData extends Pick<DiffFile, "filePath" | "diff"> {
	title: string;
}

export default SideBarResourceData;
