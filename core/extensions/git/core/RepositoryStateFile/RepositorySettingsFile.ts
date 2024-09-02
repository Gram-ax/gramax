import FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import { RepState } from "@ext/git/core/Repository/model/RepostoryState";

const REPOSITORY_STATE_FILEPATH = ".git/gramax/state.json";

export default class RepositoryStateFile {
	private _state: RepState;
	constructor(private _repPath: Path, private _fp: FileProvider) {}

	async getState(): Promise<RepState> {
		if (!this._state) {
			if (!(await this._isGitExists())) return;
			await this._readState();
		}
		return this._state;
	}

	async saveState(state: RepState): Promise<void> {
		if (!(await this._isGitExists())) return;
		this._state = state;
		await this._writeState();
	}

	private async _writeState(): Promise<void> {
		return this._fp.write(this._getFilePath(), JSON.stringify(this._state));
	}

	private async _readState() {
		if (await this._fp.exists(this._getFilePath())) {
			this._state = JSON.parse(await this._fp.read(this._getFilePath()));
			return;
		}
		this._state = { value: "default" };
		await this._writeState();
	}

	private _getFilePath(): Path {
		return this._repPath.join(new Path([REPOSITORY_STATE_FILEPATH]));
	}

	private async _isGitExists(): Promise<boolean> {
		return this._fp.exists(this._repPath.join(new Path(".git")));
	}
}
