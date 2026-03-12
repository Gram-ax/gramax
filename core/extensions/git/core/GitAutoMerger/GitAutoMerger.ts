import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import { findMergeConflict } from "@ext/git/actions/MergeConflictHandler/logic/MergeConflictFinder";
import type { GitAutoMergerModel } from "@ext/git/core/GitAutoMerger/model/GitAutoMergerModel";
import type GitCommands from "@ext/git/core/GitCommands/GitCommands";
import type { MergeResult } from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import { GitCommentAutoMerger } from "@ext/markdown/elements/comment/edit/logic/GitCommentAutoMerger";
import assert from "assert";

export class GitAutoMerger {
	private _autoMergers: GitAutoMergerModel[] = [new GitCommentAutoMerger()];

	constructor(
		private _fp: FileProvider,
		private _git: GitCommands,
		private _repoPath: Path,
	) {}

	async merge(mergeResult: MergeResult): Promise<MergeResult> {
		return await this._tryToAutoMerge(mergeResult);
	}

	private async _tryToAutoMerge(mergeResult: MergeResult): Promise<MergeResult> {
		const newMergeResult: MergeResult = [...mergeResult];
		const processedFiles: Map<string, string> = new Map();

		for (let i = 0; i < newMergeResult.length; i++) {
			const merge = newMergeResult[i];
			if (!merge.ours) continue;

			const oursPath = this._repoPath.join(new Path(merge.ours));
			const theirsPath = merge.theirs ? this._repoPath.join(new Path(merge.theirs)) : null;

			let conflictedContent: string;
			let conflictedPath: Path;

			if ((await this._fp.exists(oursPath)) && !(await this._fp.isFolder(oursPath))) {
				conflictedContent = await this._fp.read(oursPath);
				conflictedPath = oursPath;
			} else if ((await this._fp.exists(theirsPath)) && !(await this._fp.isFolder(theirsPath))) {
				conflictedContent = await this._fp.read(theirsPath);
				conflictedPath = theirsPath;
			}

			assert(
				conflictedContent,
				`Conflict file doesn't exist. Our path: ${merge.ours}. Their path :${merge.theirs}`,
			);

			const haveConflicts = findMergeConflict(conflictedContent).length > 0;
			if (!haveConflicts) continue;

			for (const autoMerger of this._autoMergers) {
				if (!autoMerger.canProceed(merge)) continue;
				const mergedContent = await autoMerger.proceed(conflictedContent);

				if (!mergedContent) continue;
				processedFiles.set(conflictedPath.value, mergedContent);
				newMergeResult[i] = null;

				break;
			}
		}

		await this._onAutoMergeSuccess(processedFiles);

		return newMergeResult.filter(Boolean);
	}

	private async _onAutoMergeSuccess(processedFiles: Map<string, string>): Promise<void> {
		const paths: Path[] = [];
		for (const [file, content] of processedFiles) {
			await this._fp.write(new Path(file), content);
			paths.push(new Path(file));
		}

		await this._git.add(paths, true);
	}
}
