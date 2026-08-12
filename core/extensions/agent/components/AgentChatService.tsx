import type { ReactElement } from "react";
import { useAgentChatPanel } from "./hooks/useAgentChatPanel";
import ChatPanelOverlay from "./panel/ChatPanelOverlay";

const AgentChatPanelController = (): null => {
	useAgentChatPanel();
	return null;
};

const AgentChatService = {
	Init: (): ReactElement => (
		<>
			<AgentChatPanelController />
			<ChatPanelOverlay />
		</>
	),
};

export default AgentChatService;
