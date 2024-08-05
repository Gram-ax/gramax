import fs from "fs-extra";
import git, { MergeResult } from "isomorphic-git";
import http from "isomorphic-git/http/web";
import Path from "../../../logic/FileProvider/Path/Path";
import SourceType from "../../storage/logic/SourceDataProvider/model/SourceType";
import GitSourceData from "../core/model/GitSourceData.schema";

// const gitmodules = `[submodule "subModule"]\n\tpath = subModule\n\turl = git@gitlab.ics-it.ru:ics/submodule.git`;
export const FIXTURES_PATH = __dirname + "/fixtures";
export enum RemoteNames {
	Push = "remoteRepPush.git",
	Pull = "remoteRepPull.git",
	SubModulePush = "remoteSubModuleRepPush.git",
	SubModulePull = "remoteSubModuleRepPull.git",
}

export default class TestGitRepository {
	private _repDir: string;
	private _submodule: TestGitRepository;

	constructor(
		path: string,
		private _name = "testRep",
		private _isSubmodule = false,
		private _parentName: string = "",
	) {
		this._repDir = path + "/" + this._name;
		if (this._isSubmodule) return;
		// this._submodule = new TestGitRepository(this._repDir, "subModule", true, this._name);
	}

	static getRemote(): { remoteRep: TestGitRepository; remoteSubModuleRep: TestGitRepository } {
		const remoteRep = new TestGitRepository(FIXTURES_PATH, "remoteRepPush");
		const remoteSubModuleRep = new TestGitRepository(FIXTURES_PATH, "remoteSubModuleRepPush");
		return { remoteRep, remoteSubModuleRep };
	}

	get repDir() {
		return this._name;
	}

	get submodule() {
		return this._submodule;
	}

	path(path: string) {
		return new Path(this._isSubmodule ? this._parentName + "/subModule" : this._name).join(new Path(path));
	}

	get source(): GitSourceData {
		return {
			sourceType: SourceType.gitLab,
			domain: "localhost:8174",
			protocol: "http",
			token: "123",
			userName: "test",
			userEmail: "test@test.ru",
		};
	}

	async init(fromRemote = false) {
		if (this._isSubmodule || fs.existsSync(this._repDir)) return;
		if (fromRemote) {
			await git.clone({ fs, http, dir: this._repDir, url: `http://localhost:8174/${RemoteNames.Push}` });
		} else {
			fs.mkdirSync(this._repDir, { recursive: true });
			// fs.writeFileSync(this._repDir + "/.gitmodules", gitmodules);
			await git.init({ fs, dir: this._repDir });
			// await git.add({ fs, dir: this._repDir, filepath: ".gitmodules" });
			await git.commit({
				fs,
				dir: this._repDir,
				author: { name: "test_name", email: "test_email" },
				message: "init",
			});
		}
		// await this._addSubModule(fromRemote);
	}

	async setRemote(remoteName: RemoteNames) {
		await git.addRemote({
			fs,
			force: true,
			dir: this._repDir,
			remote: "origin",
			url: `http://localhost:8174/${remoteName}`,
		});
	}

	clear() {
		fs.rmSync(this._repDir, { maxRetries: 5, force: true, recursive: true });
	}

	getStatus() {
		return git.statusMatrix({ fs, dir: this._repDir });
	}

	getCurrentBranch() {
		return git.currentBranch({ fs, dir: this._repDir });
	}

	getAllBranches() {
		return git.listBranches({ fs, dir: this._repDir });
	}

	getCurrentHash() {
		return git.resolveRef({ fs, dir: this._repDir, ref: "HEAD" });
	}

	async commit(files?: { [filePath: string]: string | null }, message = "change files"): Promise<string> {
		if (files) await this.add(files);
		return await git.commit({
			fs,
			dir: this._repDir,
			author: { name: "test_name", email: "test_email" },
			message,
		});
	}

	async add(files: { [filePath: string]: string | null }) {
		for (const [path, content] of Object.entries(files)) {
			if (content !== null) fs.writeFileSync(this._repDir + "/" + path, content);
			let error;
			try {
				await git.add({ fs, dir: this._repDir, filepath: path });
			} catch (e) {
				error = e;
				try {
					await git.remove({ fs, dir: this._repDir, filepath: path });
				} catch {
					throw error;
				}
			}
		}
	}
	async createNewBranch(name: string) {
		await git.branch({ fs, dir: this._repDir, ref: name, checkout: true });
	}

	async checkout(name: string) {
		await git.checkout({ fs, dir: this._repDir, ref: name });
	}

	async mergeBranches(baseBranch: string, mergingBranch: string): Promise<MergeResult> {
		const mergeResult = await git.merge({
			fs,
			dir: this._repDir,
			ours: baseBranch,
			theirs: mergingBranch,
			abortOnConflict: false,
			author: { name: "test_name", email: "test_email" },
		});

		if (mergeResult.oid) {
			await git.checkout({
				fs,
				dir: this._repDir,
				ref: baseBranch,
				force: true,
			});

			return mergeResult;
		} else {
			console.log("Не удалось слить ветки.");
		}
	}

	async readCommit(oid: string) {
		return git.readCommit({ fs, dir: this._repDir, oid });
	}

	async resolveRef(ref: string) {
		return git.resolveRef({ fs, dir: this._repDir, ref });
	}

	private async _addSubModule(fromRemote: boolean): Promise<void> {
		if (fromRemote) {
			try {
				await git.clone({
					fs,
					http,
					dir: this._repDir + "/subModule",
					url: `http://localhost:8174/${RemoteNames.SubModulePush}`,
				});
			} catch (e) {
				console.error(e);
			}
		} else {
			fs.mkdirSync(this._repDir + "/subModule");
			await git.init({ fs, dir: this._repDir + "/subModule" });
			fs.writeFileSync(this._repDir + "/subModule/init", "init");
			await git.add({ fs, dir: this._repDir + "/subModule", filepath: "init" });
			await git.commit({
				fs,
				dir: this._repDir + "/subModule",
				author: { name: "test_name", email: "test_email" },
				message: "init submodule",
			});
		}
	}
}
