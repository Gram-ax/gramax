import Path from "../../../../logic/FileProvider/Path/Path";

type SubmoduleData = {
	path: Path;
	url: string;
	branch?: string;
};

export default SubmoduleData;
