import t from "@ext/localization/locale/translate";
import { ScrollShadowContainer } from "@ui-kit/ScrollShadowContainer";
import { clsx } from "clsx";
import { Fragment, useLayoutEffect, useMemo, useRef } from "react";
import type { ChatMessage } from "../types/chat";
import { MessageCard } from "./MessageCard";
import { ToolActivityBundle } from "./ToolActivityBundle";

function isBundlableToolMessage(m: ChatMessage): boolean {
	return m.kind === "tool_result" || m.kind === "tool_call";
}

function groupMessagesWithToolBundles(
	messages: ChatMessage[],
): Array<{ type: "single"; message: ChatMessage } | { type: "toolBundle"; messages: ChatMessage[] }> {
	const out: Array<{ type: "single"; message: ChatMessage } | { type: "toolBundle"; messages: ChatMessage[] }> = [];
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
}

type Section = {
	user: ChatMessage;
	responses: ChatMessage[];
};

type Props = {
	messages: ChatMessage[];
	streamingMessageId: string | null;
	streamText: string;
	streamLive?: boolean;
	isWaitingForFirstEvent?: boolean;
	onStreamComplete?: (id: string) => void;
};
export function MessageList({
	messages,
	streamingMessageId,
	streamText,
	streamLive = false,
	isWaitingForFirstEvent = false,
	onStreamComplete,
}: Props) {
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const innerContentRef = useRef<HTMLDivElement>(null);
	const scrollEndRef = useRef<HTMLDivElement>(null);
	const prevLastUserIdRef = useRef<string | null>(null);

	const lastUserMessageId = useMemo(() => {
		for (let i = messages.length - 1; i >= 0; i--) {
			if (messages[i].kind === "user") return messages[i].id;
		}
		return null;
	}, [messages]);

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
		return { preamble: pre, sections: result };
	}, [messages]);

	useLayoutEffect(() => {
		if (!lastUserMessageId) return;

		const prev = prevLastUserIdRef.current;
		if (lastUserMessageId === prev) return;

		prevLastUserIdRef.current = lastUserMessageId;

		const scrollToEnd = () => {
			const root = scrollContainerRef.current;
			const end = scrollEndRef.current;
			if (!root) return;
			if (end) {
				end.scrollIntoView({ block: "end", behavior: "auto" });
			} else {
				root.scrollTop = Math.max(0, root.scrollHeight - root.clientHeight);
			}
		};

		scrollToEnd();
		let alive = true;
		requestAnimationFrame(() => {
			if (!alive) return;
			scrollToEnd();
		});

		const inner = innerContentRef.current;
		if (!inner) {
			return () => {
				alive = false;
			};
		}

		const ro = new ResizeObserver(() => {
			if (!alive) return;
			scrollToEnd();
		});
		ro.observe(inner);

		const timerId = setTimeout(() => {
			alive = false;
			ro.disconnect();
		}, 800);

		return () => {
			alive = false;
			clearTimeout(timerId);
			ro.disconnect();
		};
	}, [lastUserMessageId]);

	const renderCard = (m: ChatMessage) => (
		<MessageCard
			fullDescriptionForStream={streamText}
			key={m.id}
			message={m}
			onStreamComplete={onStreamComplete}
			streamDescription={streamingMessageId === m.id}
			streamLive={streamLive}
		/>
	);

	const renderMessagesWithBundles = (list: ChatMessage[]) =>
		groupMessagesWithToolBundles(list).map((seg) => {
			if (seg.type === "toolBundle") {
				const key = `tool-bundle-${seg.messages[0]?.id ?? "x"}`;
				return (
					<Fragment key={key}>
						<ToolActivityBundle messages={seg.messages} />
					</Fragment>
				);
			}
			return renderCard(seg.message);
		});
	return (
		<ScrollShadowContainer
			className="overflow-x-hidden min-h-0 flex-1 h-full [&>div]:h-full"
			ref={scrollContainerRef}
		>
			<div className="flex h-full w-full min-w-0 flex-1 flex-col px-2" ref={innerContentRef}>
				{preamble.length > 0 && (
					<div className={clsx("flex flex-col gap-2", sections.length > 0 && "mb-2")}>
						{renderMessagesWithBundles(preamble)}
					</div>
				)}

				{sections.map(({ user, responses }, index) => {
					const isLast = index === sections.length - 1;
					return (
						<div
							className={clsx(
								"w-full min-w-0 shrink-0",
								!isLast && "pb-2",
								isLast && "flex min-h-full flex-1 flex-col",
							)}
							key={user.id}
						>
							<MessageCard
								fullDescriptionForStream={streamText}
								message={user}
								onStreamComplete={onStreamComplete}
								stickyUserPrompt
								streamDescription={streamingMessageId === user.id}
								streamLive={streamLive}
							/>
							{(responses.length > 0 || (isLast && isWaitingForFirstEvent)) && (
								<div className={clsx("w-full min-w-0 space-y-2", isLast && "flex-1")}>
									{renderMessagesWithBundles(responses)}
									{isLast && isWaitingForFirstEvent ? (
										<MessageCard
											message={{
												id: `${user.id}-thinking`,
												kind: "loading",
												statusText: t("agent.thinking"),
											}}
										/>
									) : null}
								</div>
							)}
						</div>
					);
				})}
				<div ref={scrollEndRef} />
			</div>
		</ScrollShadowContainer>
	);
}
