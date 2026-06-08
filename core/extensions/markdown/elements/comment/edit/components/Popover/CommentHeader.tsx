import { TooltipIconButton } from "@components/Atoms/TooltipIconButton";
import t from "@ext/localization/locale/translate";
import { useScrollToNextComment } from "@ext/markdown/elements/comment/edit/logic/hooks/useScrollToNextComment";
import { Divider } from "@ui-kit/Divider";

interface CommentHeaderProps {
	commentId: string;
	onClose: () => void;
	onResolve: () => void;
	renderDeleteIcon: boolean;
}

export const CommentHeader = (props: CommentHeaderProps) => {
	const { commentId, onClose, onResolve, renderDeleteIcon } = props;

	const { nextScroll, prevScroll } = useScrollToNextComment(commentId);
	return (
		<>
			<div className="flex items-center justify-between pl-4 pr-1 py-1">
				<div className="text-xs font-semibold text-primary-fg">{t("comment")}</div>
				<div className="flex items-center gap-0.5">
					<TooltipIconButton
						className="p-0.5 w-7 h-7 rounded-md"
						disabled={!prevScroll}
						icon="chevron-up"
						iconClassName="w-5 h-5"
						onClick={prevScroll ? prevScroll : undefined}
						size="xs"
						tooltip={t("comments.move.up")}
						variant="ghost"
					/>
					<TooltipIconButton
						className="p-0.5 w-7 h-7 rounded-md"
						disabled={!nextScroll}
						icon="chevron-down"
						iconClassName="w-5 h-5"
						onClick={nextScroll ? nextScroll : undefined}
						size="xs"
						tooltip={t("comments.move.down")}
						variant="ghost"
					/>
					<Divider className="h-5" orientation="vertical" />
					{renderDeleteIcon && (
						<TooltipIconButton
							className="p-1 w-7 h-7 rounded-md"
							icon="big-check2"
							iconClassName="w-4 h-4"
							onClick={onResolve}
							tooltip={t("delete-as-resolved")}
							variant="ghost"
						/>
					)}
					<TooltipIconButton
						className="p-0.5 w-7 h-7 rounded-md"
						icon="x"
						iconClassName="w-5 h-5"
						onClick={onClose}
						size="xs"
						tooltip={t("close")}
						variant="ghost"
					/>
				</div>
			</div>
			<Divider />
		</>
	);
};
