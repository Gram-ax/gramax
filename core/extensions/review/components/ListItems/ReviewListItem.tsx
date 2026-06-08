import { CommentListItem } from "@ext/review/components/ListItems/CommentListItem";
import type { ReviewListItem as ReviewListItemModel, ReviewListItemType } from "@ext/review/models/ReviewList";
import type { HTMLAttributes } from "react";

export type ReviewListItemProps = ReviewListItemModel &
	HTMLAttributes<HTMLDivElement> & {
		isRead?: boolean;
	};

const Compoenents: Record<
	Exclude<ReviewListItemType, "default">,
	React.ComponentType<Omit<ReviewListItemProps, "type">>
> = {
	comments: CommentListItem,
};

export const ReviewListItem = ({ type, ...props }: ReviewListItemProps) => {
	const Component = Compoenents[type];
	return <Component {...props} />;
};
