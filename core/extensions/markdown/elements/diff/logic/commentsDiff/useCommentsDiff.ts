import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import { CommentBlock } from "@core-ui/CommentBlock";
import { AstComment } from "@ext/markdown/elements/diff/logic/astTransformer/AstDiffTransofrmer";
import CommentsDiff, { HaveDiffFunction } from "@ext/markdown/elements/diff/logic/commentsDiff/CommentsDiff";
import isCommentBlocksEqual from "@ext/markdown/elements/diff/logic/commentsDiff/isCommentBlocksEqual";
import { useCallback } from "react";

const useCommentsDiff = (apiUrlCreator: ApiUrlCreator, oldApiUrlCreator: ApiUrlCreator) => {
	const haveDiff: HaveDiffFunction = useCallback(
		async (modifiedComment) => {
			const { id } = modifiedComment;
			const url = apiUrlCreator.getComment(id);
			const oldUrl = oldApiUrlCreator.getComment(id);

			const newCommentsRes = await FetchService.fetch<CommentBlock>(url);
			if (!newCommentsRes.ok) return false;

			const oldCommentsRes = await FetchService.fetch<CommentBlock>(oldUrl);
			if (!oldCommentsRes.ok) return false;

			const newComment = await newCommentsRes.json();
			const oldComment = await oldCommentsRes.json();

			return !isCommentBlocksEqual(newComment, oldComment);
		},
		[apiUrlCreator, oldApiUrlCreator],
	);

	const getCommentsDiff = useCallback(
		(oldComments: AstComment, newComments: AstComment) => {
			return CommentsDiff.getDiff(oldComments, newComments, haveDiff);
		},
		[haveDiff],
	);

	return getCommentsDiff;
};

export default useCommentsDiff;
