import isNavigatorAvailable from "@core-ui/isNavigatorAvailable";
import { tryCopyToClipboard } from "@core-ui/utils/clipboard";
import { cn } from "@core-ui/utils/cn";
import t from "@ext/localization/locale/translate";
import { IconButton } from "@ui-kit/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { type MouseEvent, useCallback, useState } from "react";

export interface CopyAnswerButtonProps {
	text: string;
}

export const CopyAnswerButton = ({ text }: CopyAnswerButtonProps) => {
	const [isCopied, setIsCopied] = useState(false);
	const copyAllowed = isNavigatorAvailable();

	const onClickHandler = useCallback(
		(event: MouseEvent<HTMLButtonElement>) => {
			if (!copyAllowed) return;
			event.preventDefault();
			tryCopyToClipboard(text, { showPopover: false }).then((copied) => setIsCopied(copied));
		},
		[text, copyAllowed],
	);

	const onOpenChange = useCallback((open: boolean) => {
		if (!open) return;
		setIsCopied(false);
	}, []);

	return (
		<div className="-ml-1 flex">
			<Tooltip delayDuration={0} onOpenChange={onOpenChange}>
				<TooltipTrigger asChild>
					<IconButton
						className={cn(
							"p-1 opacity-60 transition-all duration-150",
							"hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
							isCopied && "opacity-100",
						)}
						icon={isCopied ? "Check" : "Copy"}
						iconClassName="size-4"
						onClick={onClickHandler}
						size="xs"
						variant="text"
					/>
				</TooltipTrigger>
				<TooltipContent>{isCopied ? t("copied") : t("click-to-copy")}</TooltipContent>
			</Tooltip>
		</div>
	);
};
