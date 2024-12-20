import CommentCounterService, { type AuthoredCommentsByAuthor } from "@core-ui/ContextServices/CommentCounter";
import useWatch from "@core-ui/hooks/useWatch";
import type { Signature } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import { useState } from "react";

export type UseReviewerCommentsProps = { authors: Signature[] };

const useReviewerComments = ({
	authors,
}: UseReviewerCommentsProps): {
	comments: AuthoredCommentsByAuthor;
} => {
	const comments = CommentCounterService.value;

	const [filteredComments, setFilteredComments] = useState<AuthoredCommentsByAuthor>({});

	useWatch(() => {
		const filteredComments: AuthoredCommentsByAuthor = {};
		authors.forEach((author) => {
			filteredComments[author.email] = comments?.[author.email] || { total: 0, pathnames: {} };
		});
		setFilteredComments(filteredComments);
	}, [comments]);

	return { comments: filteredComments };
};

export default useReviewerComments;
