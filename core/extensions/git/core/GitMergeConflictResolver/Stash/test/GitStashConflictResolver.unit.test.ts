/**
 * @jest-environment node
 */

import GitStorage from "@ext/git/core/GitStorage/GitStorage";
import Repository from "@ext/git/core/Repository/Repository";
import { RepStashConflictState } from "@ext/git/core/Repository/model/RepostoryState";
import RepositoryStateFile from "@ext/git/core/RepositoryStateFile/RepositorySettingsFile";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import DiskFileProvider from "../../../../../../logic/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "../../../../../../logic/FileProvider/Path/Path";
import GitVersionControl from "../../../GitVersionControl/GitVersionControl";
import GitStashConflictResolver from "../GitStashConflictResolver";

const mockUserData: SourceData = {
	sourceType: SourceType.gitHub,
	userEmail: "test-email@email.com",
	userName: "test user",
};

const path = (path: string) => new Path(path);
const repPath = (path: string) => new Path(["testRep", path]);
async function writeFile(path: string, content: string): Promise<Path> {
	await dfp.write(repPath(path), content);
	return new Path(path);
}
const commit = async (
	gvc: GitVersionControl,
	files: { [filePath: string]: string | null },
	message = "change files",
): Promise<void> => {
	if (!files) return gvc.commit(message, mockUserData);
	await Promise.all(
		Object.entries(files).map(async ([path, content]) => {
			await dfp.write(repPath(path), content);
		}),
	);
	await gvc.add(Object.keys(files).map(path));
	return gvc.commit(message, mockUserData);
};

const dfp = new DiskFileProvider(__dirname);

let resolver: GitStashConflictResolver;
let gvc: GitVersionControl;

const CONFLICT_CONTENT = `<<<<<<< Updated upstream
conflict content ours
=======
conflict content theirs
>>>>>>> Stashed changes
`;

describe("GitStashConflictResolver", () => {
	beforeEach(async () => {
		await dfp.mkdir(path("testRep"));
		await GitVersionControl.init(dfp, path("testRep"), mockUserData);
		gvc = new GitVersionControl(path("testRep"), dfp);
		await commit(gvc, { "1.txt": "init" });
		const storage = new GitStorage(path("testRep"), dfp);
		const repStateFile = new RepositoryStateFile(path("testRep"), dfp);
		const repo = new Repository(path("testRep"), dfp, gvc, storage, repStateFile);
		resolver = new GitStashConflictResolver(repo, dfp, path("testRep"));
	});

	afterEach(async () => {
		await dfp.delete(path("testRep"));
		resolver = null;
		gvc = null;
	});

	it("Прерывает слияние", async () => {
		const hashBefore = (await gvc.getCommitHash()).toString();
		await writeFile("1.txt", "conflict content theirs");
		const statusBefore = await gvc.getChanges();
		const stashHash = await gvc.stash(mockUserData);

		await commit(gvc, { "1.txt": "conflict content ours" });
		await gvc.applyStash(stashHash, { deleteAfterApply: false });
		expect(await dfp.read(repPath("1.txt"))).toEqual(CONFLICT_CONTENT);

		const state: RepStashConflictState = {
			value: "stashConflict",
			data: {
				conflictFiles: null,
				reverseMerge: null,
				stashHash: stashHash.toString(),
				commitHeadBefore: hashBefore,
			},
		};

		await resolver.abortMerge(state, mockUserData);

		expect(await gvc.getChanges()).toEqual(statusBefore);
		expect((await gvc.getCommitHash()).toString()).toEqual(hashBefore);
		expect(await dfp.read(repPath("1.txt"))).toEqual("conflict content theirs");
	});

	it("Решает конфликт слияния", async () => {
		const resolvedMergeFiles = [{ path: "1.txt", content: "conflict content ours and theirs :)" }];
		await writeFile("1.txt", "conflict content theirs");
		const hashBefore = (await gvc.getCommitHash()).toString();
		const stashHash = await gvc.stash(mockUserData);

		await commit(gvc, { "1.txt": "conflict content ours" });
		await gvc.applyStash(stashHash, { deleteAfterApply: false });
		expect(await dfp.read(repPath("1.txt"))).toEqual(CONFLICT_CONTENT);

		const state: RepStashConflictState = {
			value: "stashConflict",
			data: {
				conflictFiles: null,
				reverseMerge: null,
				stashHash: stashHash.toString(),
				commitHeadBefore: hashBefore,
			},
		};

		await expect(resolver.resolveConflictedFiles(resolvedMergeFiles, state, mockUserData)).resolves.toBeUndefined();
		expect(await dfp.read(repPath("1.txt"))).toBe("conflict content ours and theirs :)");
		expect((await gvc.getCommitHash()).toString()).not.toEqual(hashBefore);
	});
});
