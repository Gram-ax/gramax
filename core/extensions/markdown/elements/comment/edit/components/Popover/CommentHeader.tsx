import t from "@ext/localization/locale/translate";
import { ProgressIconButton } from "@ui-kit/Button";
import { Divider } from "@ui-kit/Divider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";

interface CommentHeaderProps {
	onClose: () => void;
	onResolve: () => void;
	renderDeleteIcon: boolean;
}

export const CommentHeader = (props: CommentHeaderProps) => {
	const { onClose, onResolve, renderDeleteIcon } = props;

	return (
		<>
			<div className="flex items-center justify-between pl-3 pr-2 py-1.5">
				<div className="text-sm font-semibold text-primary-fg">{t("comment")}</div>
				<div className="flex items-center gap-2">
					{renderDeleteIcon && (
						<Tooltip>
							<TooltipContent>{t("delete-as-resolved")}</TooltipContent>
							<TooltipTrigger asChild>
								<div className="inline-flex">
									<ProgressIconButton size="sm" icon="trash" onClick={onResolve} className="p-0.5" />
								</div>
							</TooltipTrigger>
						</Tooltip>
					)}
					<Tooltip>
						<TooltipContent>{t("close")}</TooltipContent>
						<TooltipTrigger asChild>
							<div className="inline-flex">
								<ProgressIconButton icon="x" onClick={onClose} className="p-0" />
							</div>
						</TooltipTrigger>
					</Tooltip>
				</div>
			</div>
			<Divider />
		</>
	);
};
