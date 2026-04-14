import isNavigatorAvailable from "@core-ui/isNavigatorAvailable";
import { tryCopyToClipboard } from "@core-ui/utils/clipboard";
import t from "@ext/localization/locale/translate";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { type MouseEvent, useCallback, useState } from "react";

export default function Code({ children }: { children: string }) {
	const [isCopied, setIsCopied] = useState(false);
	const copyAllowed = isNavigatorAvailable();

	const onClickHandler = useCallback(
		(event: MouseEvent<HTMLSpanElement>) => {
			if (!copyAllowed) return;
			event.preventDefault();
			tryCopyToClipboard(children, { showPopover: false }).then((copied) => setIsCopied(copied));
		},
		[children, copyAllowed],
	);

	const onOpenChange = useCallback((open: boolean) => {
		if (!open) return;
		setIsCopied(false);
	}, []);

	return (
		<Tooltip delayDuration={0} onOpenChange={onOpenChange}>
			<TooltipTrigger asChild>
				<span
					className="inline-code"
					onClick={onClickHandler}
					onPointerDown={(event) => event.preventDefault()}
				>
					<code>{children}</code>
				</span>
			</TooltipTrigger>
			<TooltipContent onPointerDownOutside={(event) => event.preventDefault()}>
				{isCopied ? t("copied") : t("click-to-copy")}
			</TooltipContent>
		</Tooltip>
	);
}
