import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import { mapAgentTimelineToViewModel } from "@ext/agent/components/utils/agentTimeline";
import { useAgentChat } from "../hooks/useAgentChat";
import { useAgentSessions } from "../hooks/useAgentSessions";
import { ChatShell } from "./ChatShell";

const AgentChatPanel = () => {
	const articleProps = ArticlePropsService.value;

	const {
		sessions,
		activeSessionId,
		createSession,
		selectSession,
		removeSession,
		saveApiKey,
		sessionError: sessionsError,
	} = useAgentSessions();

	const {
		timeline,
		draft,
		setDraft,
		send,
		cancel,
		sending,
		sessionLoading,
		sessionError: chatError,
		awaitingAgentEvent,
	} = useAgentChat(activeSessionId, articleProps.ref.path);

	const vm = mapAgentTimelineToViewModel(timeline);

	return (
		<ChatShell
			activeSessionId={activeSessionId}
			draft={draft}
			inputDisabled={sending || sessionLoading || !activeSessionId}
			isSending={sending}
			isWaitingForFirstEvent={awaitingAgentEvent}
			messages={vm.messages}
			onCancel={cancel}
			onCloseTab={removeSession}
			onDraftChange={setDraft}
			onNewSession={createSession}
			onSaveSettings={saveApiKey}
			onSelectSession={selectSession}
			onSubmit={send}
			sessionError={sessionsError || chatError}
			sessions={sessions}
			streamingMessageId={vm.streamingMessageId}
			streamLive
			streamText={vm.streamText}
		/>
	);
};

export default AgentChatPanel;
