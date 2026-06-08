import { useEffect, useRef } from "react";
import type { SuggestionState } from "../types/chat";
import { useStreamingTextState } from "./useStreamingText";

interface UseStreamingLogicProps {
	streamDescription: boolean;
	fullDescriptionForStream: string;
	streamLive: boolean;
	onStreamComplete?: (id: string) => void;
	messageId: string;
	state: SuggestionState;
}

export function useStreamingLogic({
	streamDescription,
	fullDescriptionForStream,
	streamLive,
	onStreamComplete,
	messageId,
	state,
}: UseStreamingLogicProps) {
	const shouldStream = streamDescription && state === "loading" && (streamLive || Boolean(fullDescriptionForStream));

	const { visibleText, isComplete } = useStreamingTextState(fullDescriptionForStream, shouldStream && !streamLive);

	const streamDoneRef = useRef(false);
	const prevMessageIdRef = useRef<string | null>(null);

	useEffect(() => {
		const messageChanged = prevMessageIdRef.current !== messageId;
		if (messageChanged || shouldStream) {
			streamDoneRef.current = false;
		}
		prevMessageIdRef.current = messageId;
	}, [messageId, shouldStream]);

	useEffect(() => {
		if (!shouldStream || !onStreamComplete || streamLive || !isComplete || streamDoneRef.current) return;
		streamDoneRef.current = true;
		onStreamComplete(messageId);
	}, [shouldStream, onStreamComplete, streamLive, isComplete, messageId]);

	const description = streamLive && shouldStream ? fullDescriptionForStream : shouldStream ? visibleText : "";

	return {
		shouldStream,
		visibleText,
		isComplete,
		description,
	};
}
