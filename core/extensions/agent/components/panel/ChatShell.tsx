import { MessageList } from "../message/MessageList";
import type { ChatMessage } from "../types/chat";
import { ChatFooter } from "./ChatFooter";
import { ChatHeader, type SessionTabItem } from "./ChatHeader";

type ChatShellProps = {
	sessions: SessionTabItem[];
	activeSessionId: string | null;
	onSelectSession: (id: string) => void;
	onCloseTab: (id: string) => void;
	onNewSession: () => void;
	onSaveSettings?: (key: string) => void;
	sessionError?: string | null;

	messages: ChatMessage[];
	streamingMessageId: string | null;
	streamText: string;
	streamLive?: boolean;
	isWaitingForFirstEvent?: boolean;

	draft: string;
	onDraftChange: (value: string) => void;
	onSubmit: () => void;
	onCancel?: () => void;
	inputDisabled?: boolean;
	isSending?: boolean;
};

export function ChatShell({
	sessions,
	activeSessionId,
	onSelectSession,
	onCloseTab,
	onNewSession,
	onSaveSettings,
	sessionError,
	messages,
	streamingMessageId,
	streamText,
	streamLive = true,
	isWaitingForFirstEvent = false,
	draft,
	onDraftChange,
	onSubmit,
	onCancel,
	inputDisabled = false,
	isSending,
}: ChatShellProps) {
	return (
		<div className="flex h-full w-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-primary-bg border-l">
			<ChatHeader
				activeId={activeSessionId}
				onClose={onCloseTab}
				onNew={onNewSession}
				onSaveSettings={onSaveSettings}
				onSelect={onSelectSession}
				sessions={sessions}
			/>

			{sessionError && (
				<div className="shrink-0 border-b border-destructive/40 bg-destructive/10 px-1 py-2 text-xs text-destructive">
					{sessionError}
				</div>
			)}

			<MessageList
				isWaitingForFirstEvent={isWaitingForFirstEvent}
				messages={messages}
				streamingMessageId={streamingMessageId}
				streamLive={streamLive}
				streamText={streamText}
			/>

			<ChatFooter
				disabled={inputDisabled}
				onCancel={onCancel}
				onChange={onDraftChange}
				onSubmit={onSubmit}
				sending={isSending}
				value={draft}
			/>
		</div>
	);
}
