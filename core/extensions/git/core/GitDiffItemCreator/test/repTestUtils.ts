import GitCommands from "@ext/git/core/GitCommands/GitCommands";
import DiskFileProvider from "../../../../../logic/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "../../../../../logic/FileProvider/Path/Path";

const repTestUtils = {
	makeChanges: async (dfp: DiskFileProvider) => {
		await dfp.delete(new Path("1.md"));
		await dfp.write(new Path("2.md"), "new 2.md content");
		await dfp.write(new Path("4.md"), "4.md content");

		await dfp.delete(new Path("category/_index.md"));
		await dfp.write(new Path("category/articleTest.md"), "new aritcleTest content");
		await dfp.write(new Path("category/articleTest2.md"), "articleTest2 file content");
	},
	clearChanges: async (dfp: DiskFileProvider, git: GitCommands) => {
		await git.hardReset();
		await dfp.delete(new Path("4.md"));
		await dfp.delete(new Path("category/articleTest2.md"));
	},

	makeResourceChanges: async (dfp: DiskFileProvider) => {
		await dfp.delete(new Path("imgs/1.png"));
		await dfp.delete(new Path("imgs/2.png"));
		await dfp.move(new Path("imgs/2_1.png"), new Path("imgs/2.png"));
		await dfp.move(new Path("imgs/4.png"), new Path("imgs/3.png"));
	},
	clearResourceChanges: async (dfp: DiskFileProvider, git: GitCommands) => {
		await git.hardReset();
		await dfp.delete(new Path("imgs/3.png"));
	},

	makeRenameChanges: async (dfp: DiskFileProvider) => {
		await dfp.copy(new Path("_index.md"), new Path("_index2.md"));
		await dfp.delete(new Path("_index.md"));
		const index2Content = await dfp.read(new Path("_index2.md"));
		const newContent: string[] = index2Content.split("\n");
		newContent[0] = "new content";
		await dfp.write(new Path("_index2.md"), newContent.join("\n"));
	},
	clearRenameChanges: async (dfp: DiskFileProvider, git: GitCommands) => {
		await git.hardReset();
		await dfp.delete(new Path("_index2.md"));
	},
};
export default repTestUtils;
