import t from "@ext/localization/locale/translate";
import { Button, IconButton } from "@ui-kit/Button";
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
			<div className="flex items-center justify-between pl-4 pr-1 py-1">
				<div className="text-xs font-semibold text-primary-fg">{t("comment")}</div>
				<div className="flex items-center gap-0.5">
					{renderDeleteIcon && (
						<Tooltip>
							<TooltipContent>{t("delete-as-resolved")}</TooltipContent>
							<TooltipTrigger asChild>
								<div className="inline-flex">
									<IconButton
										className="p-1 w-7 h-7 rounded-md"
										icon="big-check2"
										iconClassName="w-4 h-4"
										onClick={onResolve}
										variant="ghost"
									/>
								</div>
							</TooltipTrigger>
						</Tooltip>
					)}
					<Tooltip>
						<TooltipContent>{t("close")}</TooltipContent>
						<TooltipTrigger asChild>
							<div className="inline-flex">
								<Button
									className="p-0.5 w-7 h-7 rounded-md"
									iconClassName="w-5 h-5"
									onClick={onClose}
									size="xs"
									startIcon="x"
									variant="ghost"
								/>
							</div>
						</TooltipTrigger>
					</Tooltip>
				</div>
			</div>
			<Divider />
		</>
	);
};
