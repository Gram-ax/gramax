import GitRepositoryConfig from "@ext/git/core/GitRepository/model/GitRepositoryConfig";
import Path from "../../../logic/FileProvider/Path/Path";
import FileProvider from "../../../logic/FileProvider/model/FileProvider";
import GitVersionControl from "../../git/core/GitVersionControl/GitVersionControl";
import SourceData from "../../storage/logic/SourceDataProvider/model/SourceData";
import VersionControl from "../VersionControl";
import VersionControlType from "./VersionControlType";

export default class VersionControlProvider {
	constructor(private _conf: GitRepositoryConfig) {}

	async getVersionControlByPath(path: Path, fp: FileProvider): Promise<VersionControl> {
		if (await GitVersionControl.hasInit(this._conf, fp, path)) return new GitVersionControl(this._conf, path, fp);
		return null;
	}

	async initVersionControl(
		path: Path,
		type: VersionControlType,
		fp: FileProvider,
		userData: SourceData,
	): Promise<VersionControl> {
		if (type == VersionControlType.git) return await GitVersionControl.init(this._conf, fp, path, userData);
		return null;
	}
}
