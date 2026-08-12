import { cn } from "@core-ui/utils/cn";
import { useAgentChatIsOpen } from "@ext/agent/components/store/AgentChatIsOpenStore";
import { useChatMessages } from "@ext/agent/components/store/ChatStore";
import { ScrollShadowContainer } from "@ui-kit/ScrollShadowContainer";
import { memo, useMemo, useRef } from "react";
import { useScrollToBottom } from "../hooks/useScrollToBottom";
import type { ChatMessage } from "../types/chat";
import { MessageGroup } from "./MessageGroup";
import { type Section, SectionBlock } from "./SectionBlock";

export const MessageList = memo(() => {
	const { messages, streamingMessageId, showAgentThinking } = useChatMessages();
	const isOpen = useAgentChatIsOpen();

	const { scrollContainerRef, innerContentRef } = useScrollToBottom(messages, isOpen);

	const prevSectionsRef = useRef<Section[]>([]);
	const prevPreambleRef = useRef<ChatMessage[]>([]);

	const { preamble, sections } = useMemo(() => {
		const result: Section[] = [];
		const pre: ChatMessage[] = [];
		let current: Section | null = null;

		for (const m of messages) {
			if (m.kind === "user") {
				if (current) result.push(current);
				current = { user: m, responses: [] };
			} else if (current) {
				current.responses.push(m);
			} else {
				pre.push(m);
			}
		}
		if (current) result.push(current);

		const prevSections = prevSectionsRef.current;
		const stableSections = result.map((s, i) => {
			const prev = prevSections[i];
			if (
				prev &&
				prev.user === s.user &&
				prev.responses.length === s.responses.length &&
				prev.responses.every((r, j) => r === s.responses[j])
			) {
				return prev;
			}
			return s;
		});
		prevSectionsRef.current = stableSections;

		const prevPre = prevPreambleRef.current;
		const stablePre = pre.length === prevPre.length && pre.every((m, i) => m === prevPre[i]) ? prevPre : pre;
		prevPreambleRef.current = stablePre;

		return { preamble: stablePre, sections: stableSections };
	}, [messages]);

	return (
		<ScrollShadowContainer
			className="overflow-x-hidden min-h-0 flex-1 h-full [&>div]:h-full [overflow-anchor:none]"
			ref={scrollContainerRef}
		>
			<div className="flex h-full w-full min-w-0 flex-1 flex-col px-4" ref={innerContentRef}>
				{preamble.length > 0 && (
					<div className={cn("flex flex-col gap-2", sections.length > 0 && "mb-2")}>
						<MessageGroup
							messages={preamble}
							streamingMessageId={sections.length === 0 ? streamingMessageId : null}
						/>
					</div>
				)}

				{sections.map((section, index) => {
					const isLast = index === sections.length - 1;
					return (
						<SectionBlock
							isLast={isLast}
							key={section.user.id}
							section={section}
							showThinking={isLast && showAgentThinking}
							streamingMessageId={isLast ? streamingMessageId : null}
						/>
					);
				})}
			</div>
		</ScrollShadowContainer>
	);
});
