import { cn } from "@core-ui/utils/cn";
import type { Ref } from "react";
import { useChatStreamText } from "../../store/ChatStore";
import type { AssistantChatMessage } from "../../types/chat";
import { AssistantMarkdown } from "../AssistantMarkdown";
import { CopyAnswerButton } from "../CopyAnswerButton";

export interface AssistantMessageProps {
	message: AssistantChatMessage;
	streamDescription?: boolean;
	responseRef?: Ref<HTMLDivElement>;
	showCopyButton?: boolean;
	footerAlwaysVisible?: boolean;
}

export const AssistantMessage = ({
	message,
	streamDescription = false,
	responseRef,
	showCopyButton = false,
	footerAlwaysVisible = false,
}: AssistantMessageProps) => {
	const streamText = useChatStreamText(streamDescription);
	const isLoading = message.isLoading ?? false;
	const shouldStream = streamDescription && isLoading;

	const displayDescription = shouldStream ? streamText : message.description;
	const hasContent = displayDescription !== "" || shouldStream;
	const showFooter = showCopyButton && !isLoading && displayDescription !== "";

	return (
		<div className="w-full min-w-0" ref={responseRef}>
			{hasContent && <AssistantMarkdown text={displayDescription} />}
			{showFooter && (
				<div
					className={cn(
						"flex items-center gap-1",
						!footerAlwaysVisible &&
							"opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover/turn:opacity-100",
					)}
				>
					<CopyAnswerButton text={displayDescription} />
				</div>
			)}
		</div>
	);
};
