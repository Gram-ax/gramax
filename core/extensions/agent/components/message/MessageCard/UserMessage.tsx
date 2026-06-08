import { tryCopyToClipboard } from "@core-ui/utils/clipboard";
import { IconButton } from "@ui-kit/Button";
import { clsx } from "clsx";
import { type Ref, useEffect, useState } from "react";
import { ClampedMessage } from "./ClampedMessage";

export interface UserMessageProps {
	userText: string;
	stickyUserPrompt?: boolean;
	userPromptAnchorRef?: Ref<HTMLDivElement>;
}

export function UserMessage({ userText, stickyUserPrompt = false, userPromptAnchorRef }: UserMessageProps) {
	const [isCopied, setIsCopied] = useState(false);

	useEffect(() => {
		if (!isCopied) return undefined;

		const timeoutId = setTimeout(() => {
			setIsCopied(false);
		}, 1200);

		return () => {
			clearTimeout(timeoutId);
		};
	}, [isCopied]);

	const handleCopy = () => {
		void tryCopyToClipboard(userText, { showPopover: false }).then((copied) => {
			if (copied) setIsCopied(true);
		});
	};

	return (
		<div
			className={clsx(
				"group w-full min-w-0 pt-3 pb-2",
				stickyUserPrompt && clsx("top-0 bg-primary-bg transition-[padding] duration-200 ease-out"),
			)}
			ref={userPromptAnchorRef}
		>
			<div className="flex items-start gap-1">
				<div className="flex shrink-0 items-end justify-start pb-1">
					<IconButton
						className={clsx(
							"p-1 opacity-0 transition-all duration-150",
							"group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
							isCopied && "opacity-100",
						)}
						icon={isCopied ? "Check" : "Copy"}
						iconClassName="size-4"
						onClick={handleCopy}
						size="xs"
						variant="text"
					/>
				</div>
				<div className="flex min-w-0 flex-1 items-stretch rounded-xl rounded-br-none border-secondary-border border-[0.5px] bg-background py-2 pl-3 pr-2.5">
					<div className="min-w-0 flex-1 text-sm text-primary-fg">
						<ClampedMessage className="whitespace-pre-line" text={userText} />
					</div>
				</div>
			</div>
		</div>
	);
}
