import { useChatSessions } from "@ext/agent/components/store/ChatStore";

export const ChatSessionError = () => {
	const { sessionError } = useChatSessions();
	if (!sessionError) return null;

	return (
		<div className="shrink-0 border-b border-status-error-secondary-border bg-status-error-bg px-1 py-2 text-xs text-status-error">
			{sessionError}
		</div>
	);
};
