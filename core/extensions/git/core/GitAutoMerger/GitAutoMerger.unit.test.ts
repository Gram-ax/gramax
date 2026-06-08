import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import { GitAutoMerger } from "@ext/git/core/GitAutoMerger/GitAutoMerger";
import type GitCommands from "@ext/git/core/GitCommands/GitCommands";
import type { MergeConflictInfo } from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";

describe("GitAutoMerger", () => {
	const repoPath = new Path("repo");

	const createFileProvider = (overrides: Partial<FileProvider>): FileProvider =>
		({
			exists: jest.fn(),
			isFolder: jest.fn(),
			read: jest.fn(),
			write: jest.fn(),
			...overrides,
		}) as unknown as FileProvider;

	const createGitCommands = (): GitCommands =>
		({
			add: jest.fn(),
		}) as unknown as GitCommands;

	test("keeps conflict when conflicted file content is empty", async () => {
		const conflict: MergeConflictInfo = {
			ancestor: ".gitbook/assets/1 (1).png",
			ours: ".gitbook/assets/1 (1).png",
			theirs: null,
		};
		const fp = createFileProvider({
			exists: jest.fn().mockResolvedValue(true),
			isFolder: jest.fn().mockResolvedValue(false),
			read: jest.fn().mockResolvedValue(""),
		});
		const git = createGitCommands();
		const merger = new GitAutoMerger(fp, git, repoPath);

		await expect(merger.merge([conflict])).resolves.toEqual([conflict]);
		expect(fp.write).not.toHaveBeenCalled();
		expect(git.add).toHaveBeenCalledWith([], true);
	});

	test("keeps conflict when neither side points to an existing file", async () => {
		const conflict: MergeConflictInfo = {
			ancestor: ".gitbook/assets/1 (1).png",
			ours: ".gitbook/assets/1 (1).png",
			theirs: null,
		};
		const fp = createFileProvider({
			exists: jest.fn().mockResolvedValue(false),
		});
		const git = createGitCommands();
		const merger = new GitAutoMerger(fp, git, repoPath);

		await expect(merger.merge([conflict])).resolves.toEqual([conflict]);
		expect(fp.read).not.toHaveBeenCalled();
		expect(fp.write).not.toHaveBeenCalled();
		expect(git.add).toHaveBeenCalledWith([], true);
	});
});
