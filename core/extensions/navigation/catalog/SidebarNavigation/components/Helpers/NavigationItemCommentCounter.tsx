import t from "@ext/localization/locale/translate";
import { useGetTotalCommentsByPathname } from "@ext/markdown/elements/comment/edit/logic/stores/CommentsStore";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";

interface NavigationItemCommentCounterProps {
	pathname: string;
}

export const NavigationItemCommentCounter = ({ pathname }: NavigationItemCommentCounterProps) => {
	const total = useGetTotalCommentsByPathname(pathname);
	if (total === 0) return null;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div className="min-w-4 rounded-full rounded-bl-none bg-status-warning-hover px-1 py-[3px] text-center text-[10px] leading-none text-secondary-bg">
					{total}
				</div>
			</TooltipTrigger>
			<TooltipContent>{t("numbero-of-unsolved-comments")}</TooltipContent>
		</Tooltip>
	);
};
