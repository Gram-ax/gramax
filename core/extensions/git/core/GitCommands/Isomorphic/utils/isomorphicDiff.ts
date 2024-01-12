import Path from "@core/FileProvider/Path/Path";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { GitStatus } from "@ext/git/core/GitWatcher/model/GitStatus";
import git, { PromiseFsClient } from "isomorphic-git";

const isomorphicDiff = async (treeA: string, treeB: string, fs: PromiseFsClient, dir: string): Promise<GitStatus[]> => {
	return await git.walk({
		fs,
		dir,
		trees: [git.TREE({ ref: treeA }), git.TREE({ ref: treeB })],
		map: async function (filepath, [A, B]): Promise<GitStatus> {
			if (!A && !B) return;
			const aType = await A?.type();
			const bType = await B?.type();
			const isDirectory = filepath === "." || aType === "tree" || bType === "tree";
			if (isDirectory) return;

			const Aoid = await A?.oid();
			const Boid = await B?.oid();

			let type: FileStatus = null;
			if (Aoid !== Boid) {
				type = FileStatus.modified;
			}
			if (Aoid === undefined) {
				type = FileStatus.new;
			}
			if (Boid === undefined) {
				type = FileStatus.delete;
			}
			if (!type) return;

			return {
				path: new Path(filepath),
				type: type,
			};
		},
	});
};

export default isomorphicDiff;
