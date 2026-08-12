import { cn } from "@core-ui/utils/cn";
import t from "@ext/localization/locale/translate";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { useEffect, useRef, useState } from "react";

interface ClampedMessageProps {
	text: string;
	lines?: number;
	className?: string;
}

export const ClampedMessage = ({ text, lines = 20, className }: ClampedMessageProps) => {
	const measureRef = useRef<HTMLDivElement>(null);
	const [isTooLong, setIsTooLong] = useState(false);

	useEffect(() => {
		const el = measureRef.current;
		if (!el) return;

		const styles = getComputedStyle(el);
		const lineHeight = parseFloat(styles.lineHeight);

		const fallbackLineHeight = parseFloat(styles.fontSize) * 1.2;

		const realLineHeight = Number.isNaN(lineHeight) ? fallbackLineHeight : lineHeight;

		const maxHeight = realLineHeight * lines;

		setIsTooLong(el.scrollHeight > maxHeight);
	}, [lines]);

	return (
		<>
			<div className="invisible absolute z-[-1] w-full whitespace-pre-line break-all" ref={measureRef}>
				{text}
			</div>

			<Tooltip>
				<TooltipTrigger asChild>
					<div className={cn(isTooLong ? ["text-muted", "cursor-pointer"] : "cursor-default", className)}>
						{isTooLong ? t("agent.message-too-long") : text}
					</div>
				</TooltipTrigger>

				{isTooLong && (
					<TooltipContent className="whitespace-pre-line" focus="default">
						{text}
					</TooltipContent>
				)}
			</Tooltip>
		</>
	);
};
