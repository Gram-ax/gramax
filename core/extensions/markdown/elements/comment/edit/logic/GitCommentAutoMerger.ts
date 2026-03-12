import type { Comment, CommentBlock } from "@core-ui/CommentBlock";
import MergeConflictPicker from "@ext/git/actions/MergeConflictHandler/logic/MergeConflictPicker";
import type { GitAutoMergerModel } from "@ext/git/core/GitAutoMerger/model/GitAutoMergerModel";
import type { MergeConflictInfo } from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import * as yaml from "js-yaml";

type CommentsFileData = Record<string, CommentBlock<string>>;

export class GitCommentAutoMerger implements GitAutoMergerModel {
	canProceed(conflict: MergeConflictInfo): boolean {
		return conflict.ours.endsWith(".comments.yaml") && conflict.theirs.endsWith(".comments.yaml");
	}

	async proceed(conflictContent: string): Promise<string> {
		const ourComments = await this._parseYamlToComments(MergeConflictPicker.pick(conflictContent, "top"));
		const theirComments = await this._parseYamlToComments(MergeConflictPicker.pick(conflictContent, "bottom"));

		const mergedComments = this._combineComments(ourComments, theirComments);
		return await this._stringifyCommentsToYaml(mergedComments);
	}

	private _combineComments(ourComments: CommentsFileData, theirComments: CommentsFileData): CommentsFileData {
		const allIds = new Set([...Object.keys(ourComments ?? {}), ...Object.keys(theirComments ?? {})]);
		return Array.from(allIds).reduce((acc, id) => {
			const mergedBlock = this._mergeBlocks(ourComments?.[id], theirComments?.[id]);

			if (mergedBlock) acc[id] = mergedBlock;
			return acc;
		}, {} as CommentsFileData);
	}

	private _mergeBlocks(ours: CommentBlock<string>, theirs: CommentBlock<string>): CommentBlock<string> {
		const comment = this._mergeMainComment(ours?.comment, theirs?.comment);
		const answers = this._mergeAndSortAnswers(ours?.answers ?? [], theirs?.answers ?? []);
		return { comment, answers };
	}

	private _mergeMainComment(a: Comment<string>, b: Comment<string>): Comment<string> {
		if (!a) return b;
		if (!b) return a;
		return new Date(a.dateTime).getTime() >= new Date(b.dateTime).getTime() ? a : b;
	}

	private _mergeAndSortAnswers(ours: Comment<string>[], theirs: Comment<string>[]): Comment<string>[] {
		const combined = [...ours, ...theirs];
		combined.sort((x, y) => new Date(x.dateTime).getTime() - new Date(y.dateTime).getTime());
		return combined;
	}

	private async _parseYamlToComments(content: string): Promise<CommentsFileData> {
		const comments = yaml.load(content) as CommentsFileData;
		return comments ?? {};
	}

	private async _stringifyCommentsToYaml(comments: CommentsFileData): Promise<string> {
		return yaml.dump(comments);
	}
}
