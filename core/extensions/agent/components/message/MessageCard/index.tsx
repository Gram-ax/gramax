import { memo, type Ref } from "react";
import type { ChatMessage } from "../../types/chat";
import { AssistantMessage } from "./AssistantMessage";
import { CancelledStatusMessage } from "./CancelledStatusMessage";
import { ErrorStatusMessage } from "./ErrorStatusMessage";
import { UserMessage } from "./UserMessage";
import { WarningStatusMessage } from "./WarningStatusMessage";

export type MessageCardProps = {
	message: ChatMessage;
	streamDescription?: boolean;
	stickyUserPrompt?: boolean;
	userPromptAnchorRef?: Ref<HTMLDivElement>;
	responseRef?: Ref<HTMLDivElement>;
	copyButtonMessageId?: string | null;
	cancelledDurationMs?: number;
	footerAlwaysVisible?: boolean;
};

const messageCardPropsAreEqual = (prev: MessageCardProps, next: MessageCardProps): boolean =>
	prev.message.id === next.message.id &&
	prev.message.kind === next.message.kind &&
	prev.streamDescription === next.streamDescription &&
	prev.stickyUserPrompt === next.stickyUserPrompt &&
	prev.userPromptAnchorRef === next.userPromptAnchorRef &&
	prev.responseRef === next.responseRef &&
	prev.copyButtonMessageId === next.copyButtonMessageId &&
	prev.cancelledDurationMs === next.cancelledDurationMs &&
	prev.footerAlwaysVisible === next.footerAlwaysVisible;

export const MessageCard = memo(
	({
		message,
		streamDescription = false,
		stickyUserPrompt = false,
		userPromptAnchorRef,
		responseRef,
		copyButtonMessageId,
		cancelledDurationMs,
		footerAlwaysVisible,
	}: MessageCardProps) => {
		switch (message.kind) {
			case "user":
				return (
					<UserMessage
						attachments={message.attachments}
						stickyUserPrompt={stickyUserPrompt}
						userPromptAnchorRef={userPromptAnchorRef}
						userText={message.userText}
					/>
				);
			case "error":
				return (
					<ErrorStatusMessage
						errorType={message.errorType}
						responseRef={responseRef}
						statusText={message.statusText}
					/>
				);
			case "warning":
				return <WarningStatusMessage responseRef={responseRef} statusText={message.statusText} />;
			case "cancelled":
				return <CancelledStatusMessage durationMs={cancelledDurationMs} responseRef={responseRef} />;
			case "assistant":
				return (
					<AssistantMessage
						footerAlwaysVisible={footerAlwaysVisible}
						message={message}
						responseRef={responseRef}
						showCopyButton={copyButtonMessageId === message.id}
						streamDescription={streamDescription}
					/>
				);
			default:
				return null;
		}
	},
	messageCardPropsAreEqual,
);
MessageCard.displayName = "MessageCard";
