import isNavigatorAvailable from "@core-ui/isNavigatorAvailable";
import { tryCopyToClipboard } from "@core-ui/utils/clipboard";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { type MouseEvent, useCallback, useState } from "react";

interface RevisionOidCopyProps {
	children: string;
	value?: string;
	className?: string;
}

const RevisionOidCopy = ({ children, value }: RevisionOidCopyProps) => {
	const [isCopied, setIsCopied] = useState(false);
	const copyAllowed = isNavigatorAvailable();

	const onClickHandler = useCallback(
		(event: MouseEvent<HTMLSpanElement>) => {
			if (!copyAllowed) return;
			event.preventDefault();
			tryCopyToClipboard(value ?? children, { showPopover: false }).then((copied) => setIsCopied(copied));
		},
		[children, value, copyAllowed],
	);

	const onOpenChange = useCallback((open: boolean) => {
		if (!open) return;
		setIsCopied(false);
	}, []);

	return (
		<Tooltip delayDuration={0} onOpenChange={onOpenChange}>
			<TooltipTrigger asChild>
				<Button
					className="h-auto p-0 rounded-none shrink-0 font-normal"
					onClick={onClickHandler}
					onPointerDown={(event) => event.preventDefault()}
					size="xs"
					variant="text"
				>
					{children}
				</Button>
			</TooltipTrigger>
			<TooltipContent onPointerDownOutside={(event) => event.preventDefault()}>
				{isCopied ? t("copied") : t("click-to-copy")}
			</TooltipContent>
		</Tooltip>
	);
};

export default RevisionOidCopy;
