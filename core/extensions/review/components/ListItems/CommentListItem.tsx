import Date from "@components/Atoms/Date";
import { extractTextFromJSONContent } from "@core-ui/utils/extractTextFromJSONContent";
import t, { pluralize } from "@ext/localization/locale/translate";
import { Avatar, AvatarFallback, getAvatarFallback } from "@ui-kit/Avatar";
import { Indicator } from "@ui-kit/Indicator";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";
import { BaseListItem } from "./BaseListItem";
import type { ReviewListItemProps } from "./ReviewListItem";

export const CommentListItem = ({ author, date, commentBlock, isRead, ...props }: ReviewListItemProps) => {
	const pluralized = pluralize(commentBlock?.answers?.length ?? 0, {
		one: t("comments.answers.one"),
		few: t("comments.answers.few"),
		many: t("comments.answers.many"),
	});

	return (
		<BaseListItem {...props}>
			<div className="flex items-center gap-2 w-full min-w-0">
				<Avatar className="shrink-0 font-normal" size="2xs">
					<AvatarFallback uniqueId={author?.email}>{getAvatarFallback(author?.name ?? "")}</AvatarFallback>
				</Avatar>
				<TextOverflowTooltip className="text-xs font-semibold text-primary-fg">
					{author?.name}
				</TextOverflowTooltip>
				<span className="ml-auto shrink-0 text-xs text-muted">
					<Date date={date} />
				</span>
				{!isRead && <Indicator className="shrink-0 bg-status-error rounded-full" size="xs" />}
			</div>
			<TextOverflowTooltip className="line-clamp-2 w-full whitespace-normal text-xs text-primary-fg">
				{extractTextFromJSONContent(commentBlock?.comment?.content)}
			</TextOverflowTooltip>
			{(commentBlock?.answers?.length ?? 0) > 0 && (
				<span className="mr-auto shrink-0 text-xs text-muted">{pluralized}</span>
			)}
		</BaseListItem>
	);
};
