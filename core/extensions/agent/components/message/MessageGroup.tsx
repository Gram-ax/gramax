import { Fragment, memo, useMemo } from "react";
import type { ChatMessage } from "../types/chat";
import { MessageCard } from "./MessageCard";
import { ToolActivityBundle } from "./ToolActivityBundle";

type BundledSegment = { type: "single"; message: ChatMessage } | { type: "toolBundle"; messages: ChatMessage[] };

const isBundlableToolMessage = (m: ChatMessage): boolean => m.kind === "tool_result" || m.kind === "tool_call";

const groupMessagesWithToolBundles = (messages: ChatMessage[]): BundledSegment[] => {
	const out: BundledSegment[] = [];
	let i = 0;
	while (i < messages.length) {
		const m = messages[i];
		if (isBundlableToolMessage(m)) {
			const bundle: ChatMessage[] = [];
			while (i < messages.length && isBundlableToolMessage(messages[i])) {
				bundle.push(messages[i]);
				i++;
			}
			out.push({ type: "toolBundle", messages: bundle });
		} else {
			out.push({ type: "single", message: m });
			i++;
		}
	}
	return out;
};

type MessageGroupProps = {
	messages: ChatMessage[];
	streamingMessageId: string | null;
	copyButtonMessageId?: string | null;
	cancelledDurationMs?: number;
	footerAlwaysVisible?: boolean;
};

export const MessageGroup = memo(
	({
		messages,
		streamingMessageId,
		copyButtonMessageId,
		cancelledDurationMs,
		footerAlwaysVisible,
	}: MessageGroupProps) => {
		const segments = useMemo(() => groupMessagesWithToolBundles(messages), [messages]);
		return (
			<>
				{segments.map((seg) => {
					if (seg.type === "toolBundle") {
						const key = `tool-bundle-${seg.messages[0]?.id ?? "x"}`;
						return (
							<Fragment key={key}>
								<ToolActivityBundle messages={seg.messages} />
							</Fragment>
						);
					}
					return (
						<MessageCard
							cancelledDurationMs={cancelledDurationMs}
							copyButtonMessageId={copyButtonMessageId}
							footerAlwaysVisible={footerAlwaysVisible}
							key={seg.message.id}
							message={seg.message}
							streamDescription={streamingMessageId === seg.message.id}
						/>
					);
				})}
			</>
		);
	},
);
