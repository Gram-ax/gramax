import { AstComment } from "@ext/markdown/elements/diff/logic/astTransformer/AstDiffTransofrmer";
import { Pos } from "@ext/markdown/elements/diff/logic/model/DiffLine";
import { FileStatus } from "@ext/Watchers/model/FileStatus";

export type AddedAstComment = { type: FileStatus.new; id: string; pos: Pos };
export type DeletedAstComment = { type: FileStatus.delete; id: string; oldPos: Pos };
export type ModifiedAstComment = { type: FileStatus.modified; id: string; pos: Pos; oldPos: Pos };
export type DiffAstComment = AddedAstComment | DeletedAstComment | ModifiedAstComment;

export type HaveDiffFunction = (modifiedComment: ModifiedAstComment) => boolean | Promise<boolean>;

export default abstract class CommentsDiff {
	static async getDiff(
		oldComments: AstComment,
		newComments: AstComment,
		haveDiff: HaveDiffFunction,
	): Promise<DiffAstComment[]> {
		const oldCommentsIds = Object.keys(oldComments);
		const newCommentsIds = Object.keys(newComments);

		const allCommentIds = Array.from(new Set([...oldCommentsIds, ...newCommentsIds]));

		const commentDiffs: DiffAstComment[] = await allCommentIds.mapAsync(async (commentId) => {
			const oldComment = oldComments[commentId];
			const newComment = newComments[commentId];

			if (!oldComment) return { type: FileStatus.new, id: commentId, pos: newComment };
			if (!newComment) return { type: FileStatus.delete, id: commentId, oldPos: oldComment };

			const modifiedDiff: ModifiedAstComment = {
				type: FileStatus.modified,
				id: commentId,
				pos: newComment,
				oldPos: oldComment,
			};
			if (await haveDiff(modifiedDiff)) return modifiedDiff;
		});

		return commentDiffs.filter(Boolean);
	}
}
