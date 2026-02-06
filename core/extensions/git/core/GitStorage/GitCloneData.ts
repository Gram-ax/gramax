import type FileStructure from "@core/FileStructue/FileStructure";
import type { CancelToken, RemoteProgress } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import Path from "../../../../logic/FileProvider/Path/Path";
import GitSourceData from "../model/GitSourceData.schema";
import GitStorageData from "../model/GitStorageData";

interface GitCloneData {
	fs: FileStructure;
	repositoryPath: Path;
	source: GitSourceData;
	cancelToken: CancelToken;
	branch?: string;
	allowNonEmptyDir?: boolean;
	data?: GitStorageData;
	isBare?: boolean;
	skipLfsPull?: boolean;
	onProgress?: (p: RemoteProgress) => void;
}

export default GitCloneData;
