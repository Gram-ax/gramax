import Path from "../../logic/FileProvider/Path/Path";
import { ItemStatus } from "../Watchers/model/ItemStatus";
import SourceData from "../storage/logic/SourceDataProvider/model/SourceData";
import Version from "./model/Version";
import VersionControlType from "./model/VersionControlType";
import Branch from "./model/branch/Branch";

interface VersionControl {
	getPath: () => Path;
	add: (filePaths: Path[]) => Promise<void>;
	update: () => Promise<void>;
	commit: (message: string, userData: SourceData) => Promise<void>;
	discard: (filePaths: Path[]) => Promise<void>;
	getAllBranches: () => Promise<Branch[]>;
	getCurrentBranch: () => Promise<Branch>;
	getBranch: (branchName: string) => Promise<Branch>;
	getCurrentVersion: () => Promise<Version>;
	checkoutToBranch: (branch: string) => Promise<void>;
	createNewBranch: (name: string) => Promise<void>;
	deleteLocalBranch: (branch: string) => Promise<void>;
	resetBranches: () => Promise<Branch[]>;
	checkChanges: (oldVersion: Version, newVersion: Version) => Promise<void>;
	watch(w: (changeItems: ItemStatus[]) => void): void;
	getType: () => VersionControlType;
	restoreRepositoryState: () => Promise<void>;
	getVersionControlContainsItem(path: Path): Promise<{ versionControl: VersionControl; relativePath: Path }>;
}

export default VersionControl;
