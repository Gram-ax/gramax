import { CommandTree } from "@app/commands";
import MergeType from "@ext/git/actions/MergeConflictHandler/model/MergeType";
import GitError from "@ext/git/core/GitCommands/errors/GitError";
import GitStorage from "@ext/git/core/GitStorage/GitStorage";
import GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import GitSourceData from "@ext/git/core/model/GitSourceData.schema";

const deleteBranchAfterMerge = async ({
	gvc,
	storage,
	sourceData,
	branchNameBefore,
	commands,
	catalogName,
	headBeforeMerge,
}: {
	gvc: GitVersionControl;
	storage: GitStorage;
	sourceData: GitSourceData;
	branchNameBefore: string;
	commands: CommandTree;
	catalogName: string;
	headBeforeMerge: string;
}) => {
	try {
		const branchBefore = await gvc.getBranch(branchNameBefore);
		const branchBeforeRemoteName = branchBefore.getData().remoteName;
		if (branchBeforeRemoteName) {
			await storage.deleteRemoteBranch(branchBeforeRemoteName, sourceData);
		}
		await gvc.deleteLocalBranch(branchBefore.getData().name);
	} catch (error) {
		const e: GitError = error;
		e.setProps({ mergeType: MergeType.Branches, fromMerge: true });
		await commands.versionControl.branch.mergeConflict.abort.do({
			theirsBranch: branchNameBefore,
			catalogName,
			headBeforeMerge,
		});
		throw e;
	}
};

export default deleteBranchAfterMerge;
