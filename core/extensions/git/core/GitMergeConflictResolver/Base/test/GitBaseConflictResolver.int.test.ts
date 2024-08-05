/**
 * @jest-environment node
 */

import GitStorage from "@ext/git/core/GitStorage/GitStorage";
import Repository from "@ext/git/core/Repository/Repository";
import { RepMergeConflictState } from "@ext/git/core/Repository/model/RepostoryState";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import DiskFileProvider from "../../../../../../logic/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "../../../../../../logic/FileProvider/Path/Path";
import GitVersionControl from "../../../GitVersionControl/GitVersionControl";
import GitBaseConflictResolver from "../GitBaseConflictResolver";

const mockUserData: SourceData = {
	sourceType: SourceType.gitHub,
	userEmail: "test-email@email.com",
	userName: "test user",
};
const mockState: RepMergeConflictState = { value: "mergeConflict", data: null };

const path = (path: string) => new Path(path);
const repPath = (path: string) => new Path(["testRep", path]);
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

let resolver: GitBaseConflictResolver;
let gvc: GitVersionControl;

const CONFLICT_CONTENT = `<<<<<<< ours
conflict content ours
=======
conflict content theirs
>>>>>>> theirs
`;

describe("GitBaseConflictResolver", () => {
	beforeEach(async () => {
		await dfp.mkdir(path("testRep"));
		await GitVersionControl.init(dfp, path("testRep"), mockUserData);
		gvc = new GitVersionControl(path("testRep"), dfp);
		await commit(gvc, { "1.txt": "init" });
		await gvc.createNewBranch("conflict");
		const storage = new GitStorage(path("testRep"), dfp);
		const repo = new Repository(path("testRep"), dfp, gvc, storage);
		resolver = new GitBaseConflictResolver(repo, dfp, path("testRep"));
	});

	afterEach(async () => {
		await dfp.delete(path("testRep"));
		resolver = null;
		gvc = null;
	});

	it("Прерывает слияние", async () => {
		await commit(gvc, { "1.txt": "conflict content theirs" });
		await gvc.checkoutToBranch("master");
		await commit(gvc, { "1.txt": "conflict content ours" });
		const hashBefore = (await gvc.getCommitHash()).toString();
		const statusBefore = await gvc.getChanges();
		await gvc.mergeBranch(mockUserData, "conflict");
		expect(await dfp.read(repPath("1.txt"))).toEqual(CONFLICT_CONTENT);

		await resolver.abortMerge(mockState);

		expect(await gvc.getChanges()).toEqual(statusBefore);
		expect(await dfp.read(repPath("1.txt"))).toEqual("conflict content ours");
		expect((await gvc.getCommitHash()).toString()).toEqual(hashBefore);
		expect((await gvc.getAllBranches()).map((x) => x.toString())).toEqual(["conflict", "master"]);
	});

	it("Решает конфликт слияния", async () => {
		await commit(gvc, { "1.txt": "conflict content theirs" });
		await gvc.checkoutToBranch("master");
		await commit(gvc, { "1.txt": "conflict content ours" });
		const resolvedMergeFiles = [{ path: "1.txt", content: "conflict content ours and theirs :)" }];
		await gvc.mergeBranch(mockUserData, "conflict");
		expect(await dfp.read(repPath("1.txt"))).toEqual(CONFLICT_CONTENT);

		await expect(
			resolver.resolveConflictedFiles(resolvedMergeFiles, mockState, mockUserData),
		).resolves.toBeUndefined();
		expect(await dfp.read(repPath("1.txt"))).toBe("conflict content ours and theirs :)");
	});
});
