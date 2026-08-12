import { cn } from "@core-ui/utils/cn";
import t from "@ext/localization/locale/translate";
import { Loader } from "@ui-kit/Loader";
import { memo, useMemo, useRef } from "react";
import type { ChatMessage } from "../types/chat";
import { partitionSectionMessages } from "../utils/partitionSectionMessages";
import { MessageCard } from "./MessageCard";
import { MessageGroup } from "./MessageGroup";
import { ThinkingCollapsible } from "./ThinkingCollapsible";

export type Section = {
	user: ChatMessage;
	responses: ChatMessage[];
};

const maxTs = (messages: ChatMessage[]): number => {
	let max = 0;
	for (const m of messages) if (m.ts && m.ts > max) max = m.ts;
	return max;
};

type SectionBlockProps = {
	section: Section;
	isLast: boolean;
	streamingMessageId: string | null;
	showThinking: boolean;
};

export const SectionBlock = memo(({ section, isLast, streamingMessageId, showThinking }: SectionBlockProps) => {
	const { user, responses } = section;

	const thinkingStartRef = useRef<number | null>(null);
	const turnEverActiveRef = useRef(false);
	if (showThinking) turnEverActiveRef.current = true;

	const turnDuration = useMemo(() => responses.find((m) => m.kind === "turn_duration"), [responses]);
	const isFinished = !!turnDuration;

	const firstCompletedExpIdx = useMemo(
		() => responses.findIndex((m) => m.kind === "assistant" && !m.isLoading),
		[responses],
	);
	const hasThinkingBlock = firstCompletedExpIdx !== -1;

	if (hasThinkingBlock && thinkingStartRef.current === null) {
		const phaseStartTs = responses[firstCompletedExpIdx]?.ts;
		const lastTs = maxTs(responses);
		const workSoFarMs = phaseStartTs && lastTs > phaseStartTs ? lastTs - phaseStartTs : 0;
		thinkingStartRef.current = Date.now() - workSoFarMs;
	}

	const effectiveDurationMs = useMemo(() => {
		if (!hasThinkingBlock) return undefined;
		const phaseStartTs = responses[firstCompletedExpIdx]?.ts;
		if (phaseStartTs == null) return undefined;
		if (turnDuration?.ts !== undefined) return turnDuration.ts - phaseStartTs;
		if (turnEverActiveRef.current) return undefined;
		const lastTs = maxTs(responses);
		return lastTs > phaseStartTs ? lastTs - phaseStartTs : undefined;
	}, [hasThinkingBlock, responses, firstCompletedExpIdx, turnDuration]);

	const statusMessages = useMemo(
		() => responses.filter((m) => m.kind === "cancelled" || m.kind === "error" || m.kind === "warning"),
		[responses],
	);

	const cancelledDurationMs = useMemo(() => {
		const cancelled = responses.find((m) => m.kind === "cancelled");
		if (!cancelled) return undefined;
		const endTs = cancelled.ts ?? maxTs(responses);
		const startTs = user.ts;
		if (startTs == null || !endTs || endTs <= startTs) return undefined;
		return endTs - startTs;
	}, [responses, user.ts]);

	const preThinkingMessages = useMemo(() => {
		if (hasThinkingBlock) return responses.slice(0, firstCompletedExpIdx + 1);
		return responses.filter((m) => m.kind !== "turn_duration");
	}, [responses, firstCompletedExpIdx, hasThinkingBlock]);

	const afterFirst = useMemo(() => {
		if (!hasThinkingBlock) return [];
		return responses
			.slice(firstCompletedExpIdx + 1)
			.filter((m) => m.kind !== "turn_duration" && !statusMessages.some((s) => s === m));
	}, [responses, firstCompletedExpIdx, statusMessages, hasThinkingBlock]);

	const { insideMessages, belowAssistant, belowAssistantIsGray, belowToolMessages } = useMemo(
		() => partitionSectionMessages(afterFirst, isFinished, hasThinkingBlock),
		[afterFirst, isFinished, hasThinkingBlock],
	);

	// Hide the "Worked Ns" collapsible when the turn boils down to a single assistant
	// message with no intermediate steps — there's nothing to collapse, so no point labeling it.
	const showThinkingCollapsible =
		showThinking || insideMessages.length > 0 || belowAssistant !== null || belowToolMessages.length > 0;

	const lastAssistantId = useMemo(() => {
		for (let i = responses.length - 1; i >= 0; i--) {
			const m = responses[i];
			if (m.kind === "assistant" && !m.isLoading && m.description !== "") return m.id;
		}
		return null;
	}, [responses]);

	const showCopyButton = !showThinking && streamingMessageId === null;
	const copyButtonMessageId = showCopyButton ? lastAssistantId : null;

	return (
		<div className={cn("group/turn w-full min-w-0 shrink-0")}>
			<MessageCard message={user} stickyUserPrompt streamDescription={streamingMessageId === user.id} />

			{(preThinkingMessages.length > 0 || showThinking || hasThinkingBlock) && (
				<div className={cn("w-full min-w-0 space-y-2", isLast && "flex-1 pb-5")}>
					{preThinkingMessages.length > 0 && (
						<MessageGroup
							cancelledDurationMs={cancelledDurationMs}
							copyButtonMessageId={copyButtonMessageId}
							footerAlwaysVisible={isLast}
							messages={preThinkingMessages}
							streamingMessageId={hasThinkingBlock ? null : streamingMessageId}
						/>
					)}

					{!hasThinkingBlock && showThinking && preThinkingMessages.length === 0 && (
						<div className="flex select-none items-center gap-2 text-sm text-muted-foreground">
							<Loader className="px-0 text-muted-foreground" size="sm" />
							<span>{t("agent.thinking")}</span>
						</div>
					)}

					{hasThinkingBlock && (
						<>
							{showThinkingCollapsible && (
								<ThinkingCollapsible
									durationMs={effectiveDurationMs}
									hasContent={insideMessages.length > 0}
									isActive={showThinking}
									startedAt={thinkingStartRef.current!}
								>
									<MessageGroup messages={insideMessages} streamingMessageId={null} />
								</ThinkingCollapsible>
							)}

							{belowAssistant && (
								<div className="group" data-gray={belowAssistantIsGray || undefined}>
									<MessageCard
										copyButtonMessageId={copyButtonMessageId}
										footerAlwaysVisible={isLast}
										message={belowAssistant}
										streamDescription={streamingMessageId === belowAssistant.id}
									/>
								</div>
							)}

							{belowToolMessages.length > 0 && (
								<div className="group" data-gray="true">
									<MessageGroup
										messages={belowToolMessages}
										streamingMessageId={streamingMessageId}
									/>
								</div>
							)}

							{statusMessages
								.filter((m) => isFinished || m.kind !== "warning")
								.map((m) => (
									<MessageCard cancelledDurationMs={cancelledDurationMs} key={m.id} message={m} />
								))}
						</>
					)}
				</div>
			)}
		</div>
	);
});
