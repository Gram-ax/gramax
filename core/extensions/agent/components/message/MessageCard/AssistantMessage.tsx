import type { Ref } from "react";
import { useStreamingLogic } from "../../hooks/useStreamingLogic";
import type { ChatMessage, SuggestionState } from "../../types/chat";
import { getDiffBlocks } from "../../utils/diffHelpers";
import { AssistantMarkdown } from "../AssistantMarkdown";
import { DiffViewer } from "../DiffViewer";

export interface AssistantMessageProps {
	message: ChatMessage;
	streamDescription?: boolean;
	fullDescriptionForStream?: string;
	streamLive?: boolean;
	onStreamComplete?: (id: string) => void;
	responseRef?: Ref<HTMLDivElement>;
}

export function AssistantMessage({
	message,
	streamDescription = false,
	fullDescriptionForStream = "",
	streamLive = false,
	onStreamComplete,
	responseRef,
}: AssistantMessageProps) {
	const state: SuggestionState = message.suggestionState ?? "generated";

	const { description } = useStreamingLogic({
		streamDescription,
		fullDescriptionForStream,
		streamLive,
		onStreamComplete,
		messageId: message.id,
		state,
	});

	const diffBlocks = getDiffBlocks(message);

	const displayDescription = description !== "" ? description : (message.description ?? "");

	return (
		<div className="w-full min-w-0" ref={responseRef}>
			{message.title && <h2 className="text-sm font-semibold text-primary-fg">{message.title}</h2>}
			{(displayDescription !== "" || (streamLive && streamDescription && state === "loading")) && (
				<div>
					<AssistantMarkdown text={displayDescription} />
				</div>
			)}

			{diffBlocks.map((block, index) => (
				<DiffViewer
					defaultCollapsed={index > 0}
					diff={block}
					id={index === 0 ? `diff-anchor-${message.id}` : undefined}
					key={`${message.id}-${block.filePath}-${index}`}
				/>
			))}
		</div>
	);
}
