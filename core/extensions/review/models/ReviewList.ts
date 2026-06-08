import type { CommentBlock } from "@core-ui/CommentBlock";

export type ReviewListItemType = "default" | "comments";

export type ReviewScope = "catalog" | "article";

export const ReviewListItemIcon: Record<Exclude<ReviewListItemType, "default">, string> = {
	comments: "message-square",
};

type BaseListItem = {
	type: ReviewListItemType;
	pathname: string;
	id: string;
	date: string;
	selector?: string;
};

export type CommentReviewListItem = BaseListItem & {
	type: "comments";
	author: {
		email: string;
		name: string;
	};
	commentBlock: CommentBlock;
};

export type ReviewListItem = CommentReviewListItem;
