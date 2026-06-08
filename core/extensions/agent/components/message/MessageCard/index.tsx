import type { Ref } from "react";
import type { ChatMessage } from "../../types/chat";
import { AssistantMessage } from "./AssistantMessage";
import { ErrorStatusMessage } from "./ErrorStatusMessage";
import { LoadingStatusMessage } from "./LoadingStatusMessage";
import { UserMessage } from "./UserMessage";

export type MessageCardProps = {
	message: ChatMessage;
	streamDescription?: boolean;
	fullDescriptionForStream?: string;
	streamLive?: boolean;
	onStreamComplete?: (id: string) => void;
	stickyUserPrompt?: boolean;
	userPromptAnchorRef?: Ref<HTMLDivElement>;
	responseRef?: Ref<HTMLDivElement>;
};

export function MessageCard({
	message,
	streamDescription = false,
	fullDescriptionForStream = "",
	streamLive = false,
	onStreamComplete,
	stickyUserPrompt = false,
	userPromptAnchorRef,
	responseRef,
}: MessageCardProps) {
	switch (message.kind) {
		case "user":
			return (
				<UserMessage
					stickyUserPrompt={stickyUserPrompt}
					userPromptAnchorRef={userPromptAnchorRef}
					userText={message.userText ?? ""}
				/>
			);
		case "status":
			return (
				<div className="text-sm text-muted-foreground" ref={responseRef}>
					{message.statusText ?? ""}
				</div>
			);
		case "loading":
			return <LoadingStatusMessage responseRef={responseRef} statusText={message.statusText ?? ""} />;
		case "error":
			return <ErrorStatusMessage responseRef={responseRef} statusText={message.statusText ?? ""} />;
		case "explanation":
		case "suggestion":
			return (
				<AssistantMessage
					fullDescriptionForStream={fullDescriptionForStream}
					message={message}
					onStreamComplete={onStreamComplete}
					responseRef={responseRef}
					streamDescription={streamDescription}
					streamLive={streamLive}
				/>
			);
		default:
			return null;
	}
}
