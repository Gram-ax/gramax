import { execSync } from "node:child_process";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import GitStorage from "@ext/git/core/GitStorage/GitStorage";
import GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import BareRepository from "@ext/git/core/Repository/BareRepository";
import WorkdirRepository from "@ext/git/core/Repository/WorkdirRepository";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import fs from "fs";

export default class FileRepository {
	private path: string;
	private _validateStorageNameMock: jest.SpyInstance;

	static sourceData: GitSourceData = {
		sourceType: SourceType.git,
		userEmail: "test@test.com",
		userName: "Test User",
		domain: "test.com",
		token: "test",
	};

	// for debugging
	public preventDelete = false;

	constructor(path: string) {
		this.path = path;
	}

	create(): {
		firstInstance: WorkdirRepository;
		secondInstance: WorkdirRepository;
		bare: BareRepository;
	} {
		this._mockJestGitStorageImplementation();

		const { userName, userEmail } = FileRepository.sourceData;

		const dfp = new DiskFileProvider(new Path(this.path));

		execSync("git init -b master --bare FILE_BARE", { cwd: this.path, stdio: "pipe" });

		execSync("git clone FILE_BARE FILE_WORKDIR1", { cwd: this.path, stdio: "pipe" });

		execSync(`git config user.name "${userName}"`, { cwd: this.firstPath, stdio: "pipe" });
		execSync(`git config user.email ${userEmail}`, { cwd: this.firstPath, stdio: "pipe" });

		fs.writeFileSync(this.firstPath + "/init", "init");
		execSync("git add .", { cwd: this.firstPath, stdio: "pipe" });
		execSync(`git commit -m "init"`, { cwd: this.firstPath, stdio: "pipe" });
		execSync("git push", { cwd: this.firstPath, stdio: "pipe" });

		execSync("git clone FILE_BARE FILE_WORKDIR2", { cwd: this.path, stdio: "pipe" });

		const gvcBare = new GitVersionControl(new Path("FILE_BARE"), dfp);
		const storageBare = new GitStorage(new Path("FILE_BARE"), dfp);
		const repoBare = new BareRepository(new Path("FILE_BARE"), dfp, gvcBare, storageBare);

		const gvcWorkdir1 = new GitVersionControl(new Path("FILE_WORKDIR1"), dfp);
		const storageWorkdir1 = new GitStorage(new Path("FILE_WORKDIR1"), dfp);
		const repoWorkdir1 = new WorkdirRepository(new Path("FILE_WORKDIR1"), dfp, gvcWorkdir1, storageWorkdir1);

		const gvcWorkdir2 = new GitVersionControl(new Path("FILE_WORKDIR2"), dfp);
		const storageWorkdir2 = new GitStorage(new Path("FILE_WORKDIR2"), dfp);
		const repoWorkdir2 = new WorkdirRepository(new Path("FILE_WORKDIR2"), dfp, gvcWorkdir2, storageWorkdir2);

		return {
			firstInstance: repoWorkdir1,
			secondInstance: repoWorkdir2,
			bare: repoBare,
		};
	}

	clear() {
		this._validateStorageNameMock.mockRestore();
		if (this.preventDelete) return;
		fs.rmSync(this.path + "/FILE_BARE", { recursive: true });
		fs.rmSync(this.path + "/FILE_WORKDIR1", { recursive: true });
		fs.rmSync(this.path + "/FILE_WORKDIR2", { recursive: true });
	}

	get firstPath(): string {
		return this.path + "/FILE_WORKDIR1";
	}

	get secondPath(): string {
		return this.path + "/FILE_WORKDIR2";
	}

	get barePath(): string {
		return this.path + "/FILE_BARE";
	}

	private _mockJestGitStorageImplementation() {
		this._validateStorageNameMock = jest
			.spyOn(GitStorage.prototype, "validateStorageName")
			.mockImplementation(() => Promise.resolve());
	}
}
