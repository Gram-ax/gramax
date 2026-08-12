import { useEffect } from "react";
import { setChatState } from "../store/ChatStore";
import { useAgentChat } from "./useAgentChat";
import { useAgentSessions } from "./useAgentSessions";

export const useAgentChatPanel = (): void => {
	const { activeSessionId, sessionError: sessionsError } = useAgentSessions();
	const { sessionError: chatError } = useAgentChat(activeSessionId);

	useEffect(() => {
		setChatState({ sessionError: sessionsError || chatError || null });
	}, [sessionsError, chatError]);
};
